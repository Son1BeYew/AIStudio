const express = require("express");
const {
  getOutfitTypes,
  getAllOutfitStyles,
  createOutfitStyle,
  updateOutfitStyle,
  deleteOutfitStyle,
} = require("../controllers/outfitStyleController");

const router = express.Router();

// Public route - get outfit types and hairstyles
router.get("/", getOutfitTypes);

// Admin routes - CRUD operations
router.get("/all", getAllOutfitStyles);
router.post("/", createOutfitStyle);
router.put("/:id", updateOutfitStyle);
router.delete("/:id", deleteOutfitStyle);

module.exports = router;
