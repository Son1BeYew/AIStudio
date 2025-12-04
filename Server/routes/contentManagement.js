const express = require("express");
const jwt = require("jsonwebtoken");
const History = require("../models/History");
const User = require("../models/User");
let ContentReport;
try {
  ContentReport = require("../models/ContentReport");
} catch (err) {
  console.log("ContentReport model not found, some features will be limited");
  ContentReport = null;
}

const router = express.Router();

// Middleware to verify admin token
async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * @swagger
 * /api/admin/content-management/content-statistics:
 *   get:
 *     summary: Get content statistics for admin dashboard
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalImages:
 *                   type: number
 *                 successImages:
 *                   type: number
 *                 failedImages:
 *                   type: number
 *                 pendingImages:
 *                   type: number
 *                 reportedImages:
 *                   type: number
 *                 approvedImages:
 *                   type: number
 *                 imagesChange:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/content-statistics", verifyAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Count all images (both success and failed)
    const [
      totalImages,
      todayImages,
      yesterdayImages,
      successImages,
      failedImages
    ] = await Promise.all([
      // Total all images
      History.countDocuments(),

      // Today's images
      History.countDocuments({
        createdAt: { $gte: today }
      }),

      // Yesterday's images
      History.countDocuments({
        createdAt: { $gte: yesterday, $lt: today }
      }),

      // Successful images
      History.countDocuments({ status: "success" }),

      // Failed images
      History.countDocuments({ status: "failed" })
    ]);

    // For moderation-related counts, handle both old and new data
    const [pendingImages, reportedImages, approvedImages] = await Promise.all([
      // Pending images
      History.countDocuments({
        status: "success",
        moderationStatus: "pending"
      }),

      // Reported images
      History.countDocuments({
        status: "success",
        $or: [
          { reportCount: { $gt: 0 } },
          { moderationStatus: "flagged" }
        ]
      }),

      // Approved images (including old records without moderationStatus)
      History.countDocuments({
        status: "success",
        $or: [
          { moderationStatus: "approved" },
          { moderationStatus: { $exists: false } }
        ]
      })
    ]);

    const imagesChange = yesterdayImages > 0
      ? Math.round(((todayImages - yesterdayImages) / yesterdayImages) * 100)
      : 0;

    res.json({
      totalImages,
      successImages,
      failedImages,
      pendingImages,
      reportedImages,
      approvedImages,
      imagesChange: imagesChange >= 0 ? `+${imagesChange}% hôm nay` : `${imagesChange}% hôm nay`
    });

  } catch (error) {
    console.error("Error fetching content statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/media-library:
 *   get:
 *     summary: Get media library with pagination and filters
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, approved, pending, flagged]
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [today, 7days, 30days]
 *     responses:
 *       200:
 *         description: Paginated media library
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/History'
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
// Get media library with pagination and filters
router.get("/media-library", verifyAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100, // Tăng limit lên 100 để lấy nhiều ảnh hơn
      search = "",
      status = "",
      model = "",
      dateRange = ""
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter query - get all images (both success and failed)
    const filter = {};

    if (status) {
      if (status === "success") {
        filter.status = "success";
      } else if (status === "failed") {
        filter.status = "failed";
      } else if (status === "approved") {
        // Handle approved status - include old records without moderationStatus
        filter.$or = [
          { moderationStatus: "approved" },
          { moderationStatus: { $exists: false } }
        ];
      } else {
        filter.moderationStatus = status;
      }
    }

    if (model) {
      filter.model = model;
    }

    if (search) {
      filter.$or = [
        { promptName: { $regex: search, $options: "i" } },
        { promptTitle: { $regex: search, $options: "i" } }
      ];
    }

    if (dateRange) {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    const [images, total] = await Promise.all([
      History.find(filter)
        .populate("userId", "email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      History.countDocuments(filter)
    ]);

    // Transform data for frontend
    const transformedImages = images.map(img => ({
      ...img,
      userEmail: img.userId?.email || "Unknown",
      status: img.status || (img.moderationStatus === "approved" ? "success" : "failed"),
      // Ensure localPath exists - prioritize all available image paths
      localPath: img.outputImagePath || img.localPath || img.outputImageUrl || `/outputs/${img.outputImagePath?.split('/').pop() || img._id}.jpg`
    }));

    res.json({
      images: transformedImages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Error fetching media library:", error);
    res.status(500).json({ error: "Failed to fetch media library" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/content-moderation:
 *   get:
 *     summary: Get content needing moderation
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of images pending moderation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/History'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
// Get content needing moderation
router.get("/content-moderation", verifyAdmin, async (req, res) => {
  try {
    // Get pending and flagged images for moderation
    const images = await History.find({
      status: "success",
      moderationStatus: { $in: ["pending", "flagged"] }
    })
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Transform data for frontend
    const transformedImages = images.map(img => ({
      ...img,
      userEmail: img.userId?.email || "Unknown",
      status: img.moderationStatus || "pending",
      aiSafetyScore: img.aiSafetyScore || Math.floor(Math.random() * 30) + 70 // Mock AI safety score
    }));

    res.json({
      images: transformedImages
    });

  } catch (error) {
    console.error("Error fetching content moderation:", error);
    res.status(500).json({ error: "Failed to fetch content for moderation" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/reports:
 *   get:
 *     summary: Get content reports
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of content reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentReport'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
// Get reports
router.get("/reports", verifyAdmin, async (req, res) => {
  try {
    if (!ContentReport) {
      return res.json({ reports: [] });
    }

    const reports = await ContentReport.find({
      status: "pending"
    })
      .populate("imageId", "localPath promptName userId")
      .populate("reporterId", "email")
      .populate("imageId.userId", "email")
      .sort({ createdAt: -1 })
      .lean();

    // Transform data for frontend
    const transformedReports = reports.map(report => ({
      ...report,
      image: report.imageId,
      reporterEmail: report.reporterId?.email || report.reporterEmail || "Anonymous"
    }));

    res.json({
      reports: transformedReports
    });

  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/image/{id}:
 *   get:
 *     summary: Get single image details
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/History'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
// Get single image details
router.get("/image/:id", verifyAdmin, async (req, res) => {
  try {
    const image = await History.findById(req.params.id)
      .populate("userId", "email")
      .lean();

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Get report count
    let reportCount = 0;
    if (ContentReport) {
      reportCount = await ContentReport.countDocuments({
        imageId: req.params.id,
        status: "pending"
      });
    }

    res.json({
      ...image,
      userEmail: image.userId?.email || "Unknown",
      status: image.moderationStatus || "approved",
      reportCount
    });

  } catch (error) {
    console.error("Error fetching image details:", error);
    res.status(500).json({ error: "Failed to fetch image details" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/image/{id}/status:
 *   put:
 *     summary: Update image moderation status
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, flagged, pending]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
// Update image moderation status
router.put("/image/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const imageId = req.params.id;

    const updateData = {
      moderationStatus: status,
      moderatedBy: req.user._id,
      moderatedAt: new Date(),
      ...(notes && { moderationNotes: notes })
    };

    const image = await History.findByIdAndUpdate(
      imageId,
      updateData,
      { new: true }
    );

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // If status is rejected/flagged, update report count
    if (status === "rejected" || status === "flagged") {
      await History.findByIdAndUpdate(imageId, {
        $inc: { reportCount: 1 }
      });
    }

    res.json({
      message: "Image status updated successfully",
      image
    });

  } catch (error) {
    console.error("Error updating image status:", error);
    res.status(500).json({ error: "Failed to update image status" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/image/{id}:
 *   delete:
 *     summary: Delete a single image
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Image not found
 */
// Delete single image
router.delete("/image/:id", verifyAdmin, async (req, res) => {
  try {
    const image = await History.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Delete associated reports
    await ContentReport.deleteMany({ imageId: req.params.id });

    // Delete the image record
    await History.findByIdAndDelete(req.params.id);

    // TODO: Delete actual image files from storage

    res.json({
      message: "Image deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/images/bulk-delete:
 *   delete:
 *     summary: Bulk delete multiple images
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageIds
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image IDs to delete
 *     responses:
 *       200:
 *         description: Images deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: number
 *       400:
 *         description: Valid image IDs required
 */
// Bulk delete images
router.delete("/images/bulk-delete", verifyAdmin, async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: "Valid image IDs required" });
    }

    // Delete associated reports
    await ContentReport.deleteMany({ imageId: { $in: imageIds } });

    // Delete image records
    const result = await History.deleteMany({ _id: { $in: imageIds } });

    // TODO: Delete actual image files from storage

    res.json({
      message: `Successfully deleted ${result.deletedCount} images`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Error bulk deleting images:", error);
    res.status(500).json({ error: "Failed to delete images" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/report/{id}:
 *   put:
 *     summary: Resolve a content report
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, dismissed]
 *               notes:
 *                 type: string
 *                 description: Review notes
 *     responses:
 *       200:
 *         description: Report resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 report:
 *                   $ref: '#/components/schemas/ContentReport'
 *       404:
 *         description: Report not found
 */
// Resolve report
router.put("/report/:id", verifyAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const reportId = req.params.id;

    const updateData = {
      status,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      ...(notes && { reviewNotes: notes })
    };

    const report = await ContentReport.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      message: "Report resolved successfully",
      report
    });

  } catch (error) {
    console.error("Error resolving report:", error);
    res.status(500).json({ error: "Failed to resolve report" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/report:
 *   post:
 *     summary: Submit a content report (public)
 *     tags: [Content Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageId
 *               - reason
 *             properties:
 *               imageId:
 *                 type: string
 *                 description: ID of the image being reported
 *               reason:
 *                 type: string
 *                 enum: [inappropriate, spam, copyright, other]
 *               description:
 *                 type: string
 *                 description: Additional details about the report
 *               reporterEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 report:
 *                   $ref: '#/components/schemas/ContentReport'
 *       400:
 *         description: Image ID and reason are required
 *       404:
 *         description: Image not found
 */
// Create content report (for frontend users)
router.post("/report", async (req, res) => {
  try {
    const { imageId, reason, description, reporterEmail } = req.body;

    if (!imageId || !reason) {
      return res.status(400).json({ error: "Image ID and reason are required" });
    }

    // Check if image exists
    const image = await History.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Create report
    const report = new ContentReport({
      imageId,
      reason,
      description,
      reporterEmail
    });

    await report.save();

    // Update image report count
    await History.findByIdAndUpdate(imageId, {
      $inc: { reportCount: 1 }
    });

    res.status(201).json({
      message: "Report submitted successfully",
      report
    });

  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

/**
 * @swagger
 * /api/admin/content-management/debug-check:
 *   get:
 *     summary: Debug endpoint to check data (development only)
 *     tags: [Content Management]
 *     responses:
 *       200:
 *         description: Debug data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCount:
 *                   type: number
 *                 successCount:
 *                   type: number
 *                 failedCount:
 *                   type: number
 *                 sampleImages:
 *                   type: array
 *                   items:
 *                     type: object
 *                 message:
 *                   type: string
 */
// Debug endpoint to check data
router.get("/debug-check", async (req, res) => {
  try {
    const totalCount = await History.countDocuments();
    const successCount = await History.countDocuments({ status: "success" });
    const failedCount = await History.countDocuments({ status: "failed" });

    // Get all images for testing
    const allImages = await History.find({})
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      totalCount,
      successCount,
      failedCount,
      sampleImages: allImages.map(img => ({
        _id: img._id,
        localPath: img.outputImagePath || img.localPath || img.outputImageUrl || `/outputs/${img.outputImagePath?.split('/').pop() || img._id}.jpg`,
        promptName: img.promptName || 'Unknown',
        userEmail: img.userId?.email || 'Unknown',
        model: img.model || 'nano-banana',
        createdAt: img.createdAt,
        status: img.status || 'success',
        errorMessage: img.errorMessage || ''
      })),
      message: "Check complete"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/content-management/public-images:
 *   get:
 *     summary: Get all public images (no auth required)
 *     tags: [Content Management]
 *     responses:
 *       200:
 *         description: List of all public images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       localPath:
 *                         type: string
 *                       promptName:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *                       model:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                 total:
 *                   type: number
 */
// Public endpoint for frontend testing (no auth required)
router.get("/public-images", async (req, res) => {
  try {
    const allImages = await History.find({})
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .lean();

    const transformedImages = allImages.map(img => ({
      _id: img._id,
      localPath: img.outputImagePath || img.localPath || img.outputImageUrl || `/outputs/${img.outputImagePath?.split('/').pop() || img._id}.jpg`,
      promptName: img.promptName || 'Unknown',
      userEmail: img.userId?.email || 'Unknown',
      model: img.model || 'nano-banana',
      createdAt: img.createdAt,
      status: img.status || 'success',
      errorMessage: img.errorMessage || ''
    }));

    res.json({
      images: transformedImages,
      total: transformedImages.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;