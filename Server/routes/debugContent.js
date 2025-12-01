const express = require("express");
const History = require("../models/History");
const router = express.Router();

// Debug endpoint to check actual data in History collection
router.get("/check-history", async (req, res) => {
  try {
    // Get total count of all documents
    const totalCount = await History.countDocuments();

    // Get sample documents to see structure
    const sampleDocs = await History.find().limit(5).lean();

    // Count by status field
    const statusCounts = await History.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Check if moderationStatus field exists
    const hasModerationStatus = await History.exists({ moderationStatus: { $exists: true } });

    // Count images created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await History.countDocuments({
      createdAt: { $gte: today }
    });

    res.json({
      totalCount,
      statusCounts,
      hasModerationStatus,
      todayCount,
      sampleDocs: sampleDocs.map(doc => ({
        id: doc._id,
        status: doc.status,
        moderationStatus: doc.moderationStatus,
        hasLocalPath: !!doc.localPath,
        hasOutputImagePath: !!doc.outputImagePath,
        hasOutputImageUrl: !!doc.outputImageUrl,
        localPath: doc.localPath,
        outputImagePath: doc.outputImagePath,
        outputImageUrl: doc.outputImageUrl,
        createdAt: doc.createdAt
      }))
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add this route to server.js temporarily for debugging
module.exports = router;