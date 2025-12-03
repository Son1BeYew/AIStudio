const jwt = require("jsonwebtoken");
const Session = require("../models/Session");

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Chưa đăng nhập" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session is still active in database
    if (decoded.tokenId) {
      const session = await Session.findOne({ 
        tokenId: decoded.tokenId, 
        userId: decoded.id 
      });
      
      if (!session || !session.isActive) {
        return res.status(401).json({ 
          message: "Phiên đăng nhập đã hết hạn hoặc bị thu hồi",
          sessionExpired: true 
        });
      }

      // Update last activity
      session.lastActivity = new Date();
      await session.save();
    }
    
    req.user = decoded;
    req.tokenId = decoded.tokenId; // Pass tokenId for session tracking
    next();
  } catch (error) {
    res.status(403).json({ message: "Token không hợp lệ" });
  }
};
