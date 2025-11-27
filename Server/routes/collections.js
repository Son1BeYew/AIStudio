const express = require("express");
const router = express.Router();
const {
  getCollections,
  getCollectionStats,
  getCollectionById,
  toggleLike
} = require("../controllers/collectionsController");

// Public routes
router.get("/", getCollections);
router.get("/stats", getCollectionStats);
router.get("/:id", getCollectionById);

// Like/Unlike collection (can be protected later with auth middleware)
router.post("/:id/like", toggleLike);

module.exports = router;