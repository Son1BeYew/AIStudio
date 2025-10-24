const TopUp = require("../models/TopUp");
const User = require("../models/User");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

// Khởi tạo payment Momo
exports.createMomoPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Số tiền phải lớn hơn 0" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Tạo TopUp record
    console.log("💰 Tạo TopUp: userId=", userId, "amount=", amount);
    const topUp = await TopUp.create({
      userId,
      amount,
      method: "momo",
      status: "pending",
    });
    console.log("✅ TopUp created:", topUp._id);

    // Momo API configuration từ env
    const momoConfig = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "YOUR_PARTNER_CODE",
      accessKey: process.env.MOMO_ACCESS_KEY || "YOUR_ACCESS_KEY",
      secretKey: process.env.MOMO_SECRET_KEY || "YOUR_SECRET_KEY",
      endpoint: process.env.MOMO_ENDPOINT || "https://payment.momo.vn/v2/gateway/api/create",
    };

    console.log("⚙️ Momo config:", {
      partnerCode: momoConfig.partnerCode,
      hasAccessKey: !!process.env.MOMO_ACCESS_KEY,
      hasSecretKey: !!process.env.MOMO_SECRET_KEY,
    });

    const requestId = `${Date.now()}-${topUp._id}`;
    const orderId = `topup-${topUp._id}`;
    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/topup-result?id=${topUp._id}`;
    const ipnUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/topup/callback`;

    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      requestId,
      orderId,
      amount,
      orderInfo: `Nạp tiền ${amount}đ`,
      redirectUrl,
      ipnUrl,
      requestType: "captureWallet",
      extraData: "", // Required by Momo API
      signature: "", // Will be calculated below
    };

    // Calculate signature (SHA256) - thứ tự alphabetical
    const crypto = require("crypto");
    const signatureString = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${requestBody.extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${requestBody.orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestBody.requestType}`;
    
    console.log("🔐 Signature string:", signatureString);
    
    requestBody.signature = crypto
      .createHmac("sha256", momoConfig.secretKey)
      .update(signatureString)
      .digest("hex");
    
    console.log("🔐 Calculated signature:", requestBody.signature);

    // Call Momo API
    // For development: Use mock Momo response
    if (process.env.NODE_ENV !== "production") {
      console.log("🧪 Using mock Momo response (development mode)");
      
      topUp.status = "pending";
      topUp.momoTransactionId = `MOCK_${Date.now()}`;
      await topUp.save();

      const mockResponse = {
        success: true,
        payUrl: `https://test-payment.momo.vn/mock?orderId=topup-${topUp._id}&amount=${amount}`,
        orderId: topUp._id,
        message: "🧪 Mock Momo link created (development mode)",
      };
      console.log("✅ Sending mock response:", JSON.stringify(mockResponse));
      return res.json(mockResponse);
    }

    // For production: Call real Momo API
    console.log("📤 Calling Momo API with endpoint:", momoConfig.endpoint);
    console.log("📋 Request body:", JSON.stringify(requestBody, null, 2));
    console.log("🔑 Using partnerCode:", momoConfig.partnerCode);
    console.log("🔑 Using accessKey:", momoConfig.accessKey?.substring(0, 5) + "...");
    
    try {
      const momoResponse = await axios.post(momoConfig.endpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log("✅ Momo API response:", momoResponse.data);

      // Save Momo transaction ID
      topUp.momoTransactionId = momoResponse.data.requestId;
      await topUp.save();

      res.json({
        success: true,
        payUrl: momoResponse.data.payUrl,
        orderId: topUp._id,
        message: "Tạo link thanh toán thành công",
      });
    } catch (momoError) {
      console.error("❌ Momo API error:", {
        status: momoError.response?.status,
        statusText: momoError.response?.statusText,
        data: momoError.response?.data,
        message: momoError.message,
      });

      // Log chi tiết subErrors
      if (momoError.response?.data?.subErrors) {
        console.error("📋 SubErrors detail:");
        momoError.response.data.subErrors.forEach((err, idx) => {
          console.error(`   [${idx}]:`, err);
        });
      }

      throw momoError;
    }
  } catch (error) {
    console.error("❌ Lỗi tạo payment Momo:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Lỗi tạo link thanh toán",
      details: error.message,
    });
  }
};

// Callback từ Momo
exports.momoCallback = async (req, res) => {
  try {
    console.log("🔔 Momo Callback received:", req.body);
    
    // Tìm topUp bằng requestId
    const { orderId, resultCode, transId, requestId } = req.body;

    if (!orderId && !requestId) {
      return res.status(400).json({ error: "Thiếu orderId hoặc requestId" });
    }

    // orderId format: topup-{id}
    const topUpId = orderId?.replace("topup-", "");
    const topUp = await TopUp.findById(topUpId);
    
    if (!topUp) {
      console.error("❌ TopUp not found for orderId:", orderId);
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    console.log("✅ Found topUp:", topUp._id, "resultCode:", resultCode);

    if (resultCode === 0) {
      // Payment success
      topUp.status = "success";
      topUp.momoTransactionId = transId || requestId;
      await topUp.save();
      console.log("✅ TopUp marked as success");

      res.json({ success: true, message: "Thanh toán thành công" });
    } else {
      // Payment failed
      topUp.status = "failed";
      await topUp.save();
      console.log("❌ TopUp marked as failed");
      res.json({ success: false, message: "Thanh toán thất bại" });
    }
  } catch (error) {
    console.error("❌ Lỗi callback Momo:", error.message);
    res.status(500).json({ error: "Lỗi xử lý callback" });
  }
};

// Mock callback for development (test locally)
exports.mockMomoCallback = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("🧪 Mock Momo callback for topUpId:", id);
    const topUp = await TopUp.findByIdAndUpdate(
      id,
      { 
        status: "success", 
        momoTransactionId: `MOCK_${Date.now()}`
      },
      { new: true }
    );

    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    console.log("✅ Mock callback completed for:", id);
    res.json({ success: true, topUp });
  } catch (error) {
    console.error("❌ Mock callback error:", error.message);
    res.status(500).json({ error: "Lỗi mock callback" });
  }
};

// Get topup history
exports.getTopupHistory = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    console.log("📜 Getting topup history for userId:", userId);
    const history = await TopUp.find({ userId }).sort({ createdAt: -1 });
    console.log("📋 Found", history.length, "records");
    console.log("📋 Data:", JSON.stringify(history.slice(0, 3)));
    res.json(history);
  } catch (error) {
    console.error("❌ Lỗi lấy lịch sử:", error.message);
    res.status(500).json({ error: "Lỗi lấy lịch sử nạp tiền" });
  }
};

// Get topup status
exports.getTopupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const topUp = await TopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    res.json(topUp);
  } catch (error) {
    console.error("❌ Lỗi lấy status:", error.message);
    res.status(500).json({ error: "Lỗi lấy trạng thái" });
  }
};

// Manual mark topup as success (for development/testing)
exports.markTopupSuccess = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("✅ Manually marking topup as success:", id);
    const topUp = await TopUp.findByIdAndUpdate(
      id,
      { status: "success", momoTransactionId: `MANUAL_${Date.now()}` },
      { new: true }
    );

    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    res.json({ success: true, topUp });
  } catch (error) {
    console.error("❌ Lỗi mark success:", error.message);
    res.status(500).json({ error: "Lỗi mark success" });
  }
};
