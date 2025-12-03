const Session = require("../models/Session");
const UAParser = require("ua-parser-js");

/**
 * Parse User-Agent để lấy thông tin device
 */
function parseUserAgent(userAgentString) {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  let deviceType = "unknown";
  if (result.device.type === "mobile") deviceType = "mobile";
  else if (result.device.type === "tablet") deviceType = "tablet";
  else if (result.os.name) deviceType = "desktop";

  const osName = result.os.name || "Unknown";
  const browserName = result.browser.name || "Unknown";

  // Tạo device name dễ đọc
  let deviceName = osName;
  if (result.device.vendor) {
    deviceName = `${result.device.vendor} ${result.device.model || ""}`.trim();
  } else if (osName.includes("Windows")) {
    deviceName = "Windows PC";
  } else if (osName.includes("Mac")) {
    deviceName = "Mac";
  } else if (osName.includes("iPhone")) {
    deviceName = "iPhone";
  } else if (osName.includes("Android")) {
    deviceName = "Android";
  }

  return {
    deviceType,
    deviceName: `${deviceName} - ${browserName}`,
    browser: browserName,
    os: osName,
  };
}

/**
 * Lấy location từ IP (simplified - có thể dùng service như ip-api.com)
 */
function getLocationFromIP(ip) {
  // Simplified - trong production nên dùng IP geolocation service
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) {
    return "Local Network";
  }
  return "Việt Nam"; // Default cho demo
}

/**
 * Tạo session mới khi đăng nhập
 */
exports.createSession = async (userId, req, tokenId, expiresInDays = 7) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip || req.connection?.remoteAddress || "";
    const deviceInfo = parseUserAgent(userAgent);
    const location = getLocationFromIP(ip);

    // Tính thời gian hết hạn
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const session = await Session.create({
      userId,
      ...deviceInfo,
      ip,
      location,
      tokenId,
      isActive: true,
      isCurrent: false,
      lastActivity: new Date(),
      expiresAt,
    });

    return session;
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
};

/**
 * Lấy danh sách sessions của user
 * GET /api/sessions
 */
exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentTokenId = req.tokenId; // Sẽ được set trong middleware

    const sessions = await Session.find({ userId, isActive: true })
      .sort({ lastActivity: -1 })
      .lean();

    // Format sessions cho frontend
    const formattedSessions = sessions.map((session) => {
      const now = new Date();
      const lastActivity = new Date(session.lastActivity);
      const diffMs = now - lastActivity;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let lastActiveText;
      if (diffMins < 5) {
        lastActiveText = "Đang hoạt động";
      } else if (diffMins < 60) {
        lastActiveText = `${diffMins} phút trước`;
      } else if (diffHours < 24) {
        lastActiveText = `${diffHours} giờ trước`;
      } else {
        lastActiveText = `${diffDays} ngày trước`;
      }

      return {
        _id: session._id,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        browser: session.browser,
        os: session.os,
        location: session.location,
        isCurrent: session.tokenId === currentTokenId,
        isActive: diffMins < 5,
        lastActivity: session.lastActivity,
        lastActiveText,
        createdAt: session.createdAt,
      };
    });

    res.json({
      sessions: formattedSessions,
      currentTokenId: currentTokenId,
    });
  } catch (error) {
    console.error("Error getting sessions:", error);
    res.status(500).json({ error: "Không thể tải danh sách phiên đăng nhập" });
  }
};

/**
 * Thu hồi/xóa một session
 * DELETE /api/sessions/:id
 */
exports.revokeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({ error: "Không tìm thấy phiên đăng nhập" });
    }

    // Đánh dấu session không còn active
    session.isActive = false;
    await session.save();

    res.json({ message: "Đã thu hồi phiên đăng nhập", sessionId });
  } catch (error) {
    console.error("Error revoking session:", error);
    res.status(500).json({ error: "Không thể thu hồi phiên đăng nhập" });
  }
};

/**
 * Thu hồi tất cả sessions trừ current
 * DELETE /api/sessions/revoke-all
 */
exports.revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentTokenId = req.tokenId;

    const result = await Session.updateMany(
      { userId, isActive: true, tokenId: { $ne: currentTokenId } },
      { isActive: false }
    );

    res.json({
      message: "Đã đăng xuất khỏi tất cả thiết bị khác",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error revoking all sessions:", error);
    res.status(500).json({ error: "Không thể đăng xuất các thiết bị khác" });
  }
};

/**
 * Cập nhật lastActivity cho session
 */
exports.updateSessionActivity = async (tokenId) => {
  try {
    await Session.findOneAndUpdate(
      { tokenId, isActive: true },
      { lastActivity: new Date() }
    );
  } catch (error) {
    console.error("Error updating session activity:", error);
  }
};

/**
 * Xóa session khi logout
 */
exports.deleteSessionByTokenId = async (tokenId) => {
  try {
    await Session.findOneAndUpdate({ tokenId }, { isActive: false });
  } catch (error) {
    console.error("Error deleting session:", error);
  }
};
