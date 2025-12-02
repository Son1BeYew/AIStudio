const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No token provided or invalid/expired token
 *       404:
 *         description: User not found
 */
router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("Access token expired");
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    
    console.error("JWT verify failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
