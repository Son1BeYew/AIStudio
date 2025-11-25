const Premium = require("../models/Premium");
const User = require("../models/User");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

// Fallback plan configurations for immediate availability
const FALLBACK_PLAN_CONFIGS = {
  free: {
    name: "Gói Miễn Phí",
    price: 0,
    duration: 0,
    dailyLimit: 15,
    features: [
      { name: "Tạo 15 ảnh/ngày", enabled: true },
      { name: "Chất lượng chuẩn", enabled: true },
      { name: "Tốc độ bình thường", enabled: true },
      { name: "Có watermark", enabled: true }
    ]
  },
  pro: {
    name: "Gói Pro",
    price: 199000, // 199,000 VNĐ/tháng
    duration: 30,
    dailyLimit: 100,
    features: [
      { name: "Tạo ảnh không giới hạn", enabled: true },
      { name: "Chất lượng cao (4K)", enabled: true },
      { name: "Tốc độ ưu tiên", enabled: true },
      { name: "Batch processing (10 ảnh)", enabled: true },
      { name: "Hỗ trợ chat 24/7", enabled: true },
      { name: "Không watermark", enabled: true }
    ]
  },
  max: {
    name: "Gói Max",
    price: 1990000, // 1,990,000 VNĐ/năm
    duration: 365,
    dailyLimit: 500,
    features: [
      { name: "Tạo ảnh không giới hạn", enabled: true },
      { name: "Chất lượng siêu cao (8K)", enabled: true },
      { name: "Tốc độ tối đa", enabled: true },
      { name: "Batch processing không giới hạn", enabled: true },
      { name: "Hỗ trợ ưu tiên 24/7", enabled: true },
      { name: "Không watermark", enabled: true },
      { name: "API Access", enabled: true },
      { name: "Quản lý team (5 thành viên)", enabled: true }
    ]
  }
};

// Helper function to get plan config from database with fallback
const getPlanConfigFromDB = async (planType) => {
  try {
    // First try to get from database
    const plan = await Premium.aggregate([
      { $match: { plan: planType } },
      {
        $group: {
          _id: "$plan",
          name: { $first: "$planName" },
          price: { $first: "$price" },
          duration: { $first: "$duration" },
          dailyLimit: { $first: "$dailyLimit" },
          features: { $first: "$features" }
        }
      }
    ]);

    if (plan.length > 0) {
      return {
        name: plan[0].name,
        price: plan[0].price,
        duration: plan[0].duration,
        dailyLimit: plan[0].dailyLimit,
        features: plan[0].features || []
      };
    }

    // If not found in database, use fallback config
    if (FALLBACK_PLAN_CONFIGS[planType]) {
      console.log(`Using fallback config for plan: ${planType}`);
      return FALLBACK_PLAN_CONFIGS[planType];
    }

    return null;
  } catch (error) {
    console.error("Error getting plan config:", error);
    // Fallback to hardcoded config on error
    if (FALLBACK_PLAN_CONFIGS[planType]) {
      return FALLBACK_PLAN_CONFIGS[planType];
    }
    return null;
  }
};

// Purchase premium
exports.purchasePremium = async (req, res) => {
  try {
    const { plan } = req.body;
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    if (!plan || (!FALLBACK_PLAN_CONFIGS[plan] && plan !== "monthly" && plan !== "yearly")) {
      return res.status(400).json({ error: "Gói không hợp lệ" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Don't allow purchasing free plan
    if (plan === "free") {
      return res.status(400).json({ error: "Gói miễn phí là mặc định" });
    }

    // Get current active plan with optimized query
    const currentPremium = await Premium.findOne(
      { userId, status: "active", $or: [{ endDate: { $gt: new Date() } }, { endDate: null }] },
      { plan: 1, status: 1, endDate: 1 }
    ).lean();

    // Check if user already has the same plan
    if (currentPremium.plan === plan) {
      return res.status(400).json({ error: "Bạn đang sử dụng gói này" });
    }

    // Get plan config from database
    const planConfig = await getPlanConfigFromDB(plan);
    if (!planConfig) {
      return res.status(400).json({ error: "Gói không tồn tại trong hệ thống" });
    }

    // For paid plans, create pending payment
    const premium = await Premium.create({
      userId,
      plan,
      planName: planConfig.name,
      price: planConfig.price,
      duration: planConfig.duration,
      dailyLimit: planConfig.dailyLimit,
      status: "pending",
      paymentMethod: "momo",
      features: planConfig.features
    });

    // Create Momo payment
    const momoConfig = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "YOUR_PARTNER_CODE",
      accessKey: process.env.MOMO_ACCESS_KEY || "YOUR_ACCESS_KEY",
      secretKey: process.env.MOMO_SECRET_KEY || "YOUR_SECRET_KEY",
      endpoint: process.env.MOMO_ENDPOINT || "https://payment.momo.vn/v2/gateway/api/create",
    };

    const orderInfo = `Thanh toan goi Premium ${planConfig.name}`;
    const orderId = `premium_${premium._id}_${Date.now()}`;
    const requestId = `${Date.now()}`;
    const extraData = JSON.stringify({ premiumId: premium._id.toString(), userId: userId.toString() });

    // Create signature
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${planConfig.price}&extraData=${extraData}&ipnUrl=${process.env.MOMO_IPN_URL || 'https://your-domain.com/api/premium/momo-callback'}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${process.env.MOMO_RETURN_URL || 'https://your-domain.com/topup.html'}&requestId=${requestId}&requestType=captureWallet`;

    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    const momoRequest = {
      partnerCode: momoConfig.partnerCode,
      accessKey: momoConfig.accessKey,
      requestId: requestId,
      amount: planConfig.price,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: process.env.MOMO_RETURN_URL || 'https://your-domain.com/topup.html',
      ipnUrl: process.env.MOMO_IPN_URL || 'https://your-domain.com/api/premium/momo-callback',
      extraData: extraData,
      requestType: "captureWallet",
      signature: signature,
      lang: "vi"
    };

    // Send request to Momo
    const momoResponse = await axios.post(momoConfig.endpoint, momoRequest);

    if (momoResponse.data && momoResponse.data.payUrl) {
      // Update premium with Momo transaction info
      await Premium.findByIdAndUpdate(premium._id, {
        momoTransactionId: momoResponse.data.transId || momoResponse.data.requestId,
        description: orderInfo
      });

      return res.json({
        success: true,
        payUrl: momoResponse.data.payUrl,
        premiumId: premium._id
      });
    } else {
      return res.status(500).json({
        error: "Không thể tạo thanh toán Momo",
        details: momoResponse.data
      });
    }

  } catch (error) {
    console.error("Error purchasing premium:", error);
    res.status(500).json({
      error: "Lỗi khi mua Premium",
      details: error.message
    });
  }
};

// Get premium history
exports.getPremiumHistory = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Use lean query with specific field selection for better performance
    const premiums = await Premium.find({ userId }, {
      plan: 1,
      planName: 1,
      price: 1,
      status: 1,
      createdAt: 1,
      endDate: 1,
      duration: 1,
      paymentMethod: 1,
      description: 1
    })
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

    res.json(premiums);

  } catch (error) {
    console.error("Error getting premium history:", error);
    res.status(500).json({
      error: "Lỗi khi tải lịch sử Premium",
      details: error.message
    });
  }
};

// Get current premium status
exports.getCurrentPremium = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Use lean query for better performance
    const currentPremium = await Premium.findOne(
      { userId, status: "active" },
      {
        plan: 1, // Include plan field
        planName: 1,
        price: 1,
        duration: 1,
        status: 1,
        startDate: 1,
        endDate: 1,
        imagesCreated: 1,
        dailyLimit: 1,
        features: 1
      }
    ).lean();

    if (!currentPremium) {
      // Get free plan config from database
      const freePlanConfig = await getPlanConfigFromDB("free");
      if (!freePlanConfig) {
        // Create default free plan if not found in database
        currentPremium = await Premium.create({
          userId,
          plan: "free",
          planName: "Miễn phí",
          price: 0,
          duration: 0,
          dailyLimit: 15,
          status: "active",
          paymentMethod: "free",
          features: [
            { name: "15 ảnh mỗi ngày", enabled: true },
            { name: "Chất lượng tiêu chuẩn", enabled: true },
            { name: "Tải ảnh có watermark", enabled: true },
            { name: "Mẫu cơ bản", enabled: true }
          ]
        });
      } else {
        currentPremium = await Premium.create({
          userId,
          plan: "free",
          planName: freePlanConfig.name,
          price: freePlanConfig.price,
          duration: freePlanConfig.duration,
          dailyLimit: freePlanConfig.dailyLimit,
          status: "active",
          paymentMethod: "free",
          features: freePlanConfig.features
        });
      }
    }

    const isPremium = currentPremium.plan !== "free";

    res.json({
      hasPremium: isPremium,
      planName: currentPremium.planName,
      plan: currentPremium.plan,
      expiryDate: currentPremium.endDate,
      imagesCreated: currentPremium.imagesCreated,
      dailyLimit: currentPremium.dailyLimit,
      features: currentPremium.features
    });

  } catch (error) {
    console.error("Error getting current premium:", error);
    res.status(500).json({
      error: "Lỗi khi kiểm tra trạng thái Premium",
      details: error.message
    });
  }
};

// Cancel premium
exports.cancelPremium = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    const currentPremium = await Premium.findOne({
      userId,
      status: "active",
      autoRenew: true,
      $or: [
        { endDate: { $gt: new Date() } },
        { endDate: null } // lifetime plans
      ]
    }, { _id: 1, userId: 1 }).lean(); // Only select needed fields

    if (!currentPremium) {
      return res.status(404).json({ error: "Không tìm thấy gói Premium đang hoạt động" });
    }

    // Disable auto-renew
    await Premium.findByIdAndUpdate(currentPremium._id, {
      autoRenew: false
    });

    // Update user model
    await User.findByIdAndUpdate(userId, {
      premiumAutoRenew: false
    });

    res.json({
      success: true,
      message: "Đã hủy tự động gia hạn Premium"
    });

  } catch (error) {
    console.error("Error cancelling premium:", error);
    res.status(500).json({
      error: "Lỗi khi hủy Premium",
      details: error.message
    });
  }
};

// Get available plans
exports.getPlans = async (req, res) => {
  try {
    // Get unique plans from user premium records in database
    const plans = await Premium.aggregate([
      {
        $group: {
          _id: "$plan",
          name: { $first: "$planName" },
          price: { $first: "$price" },
          duration: { $first: "$duration" },
          dailyLimit: { $first: "$dailyLimit" },
          features: { $first: "$features" }
        }
      },
      {
        $sort: { price: 1 } // Sort by price (free first)
      }
    ]);

    // Convert to object format for frontend
    const plansObject = {};
    plans.forEach(plan => {
      plansObject[plan._id] = {
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        dailyLimit: plan.dailyLimit,
        features: plan.features || []
      };
    });

    // If no plans found in user records, create default free plan to ensure plans exist
    if (Object.keys(plansObject).length === 0) {
      try {
        await Premium.create({
          userId: new mongoose.Types.ObjectId('000000000000000000000000'), // Dummy user ID
          plan: "free",
          planName: "Miễn phí",
          price: 0,
          duration: 0,
          dailyLimit: 15,
          status: "active",
          paymentMethod: "free",
          features: [
            { name: "15 ảnh mỗi ngày", enabled: true },
            { name: "Chất lượng tiêu chuẩn", enabled: true },
            { name: "Tải ảnh có watermark", enabled: true },
            { name: "Mẫu cơ bản", enabled: true }
          ]
        });
      } catch (createError) {
        // Ignore if already exists
      }

      return res.status(500).json({
        success: false,
        error: "Không tìm thấy gói nào trong hệ thống"
      });
    }

    res.json({
      success: true,
      plans: plansObject
    });
  } catch (error) {
    console.error("Error getting plans:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tải danh sách gói"
    });
  }
};

// Momo callback handler
exports.momoCallback = async (req, res) => {
  try {
    const { errorCode, orderId, amount, orderInfo, extraData } = req.body;

    if (errorCode === 0) {
      // Payment successful
      const parsedExtraData = JSON.parse(extraData);
      const { premiumId, userId } = parsedExtraData;

      // Update premium status
      const premium = await Premium.findByIdAndUpdate(
        premiumId,
        {
          status: "active",
          description: "Thanh toán thành công qua Momo"
        },
        { new: true }
      );

      if (premium) {
        // Update user model
        await User.findByIdAndUpdate(userId, {
          hasPremium: true,
          premiumType: premium.plan,
          premiumExpiry: premium.endDate
        });
      }

      console.log("Premium payment successful:", premiumId);
    } else {
      // Payment failed
      const parsedExtraData = JSON.parse(extraData);
      const { premiumId } = parsedExtraData;

      await Premium.findByIdAndUpdate(premiumId, {
        status: "failed",
        description: "Thanh toán thất bại"
      });

      console.log("Premium payment failed:", premiumId);
    }

    res.json({ message: "Callback received" });

  } catch (error) {
    console.error("Error in Momo callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};