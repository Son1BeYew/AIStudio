const express = require("express");
const router = express.Router();
const {
  getAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
} = require("../controllers/promptController");

// Nếu m có middleware check admin, có thể thêm ở đây
// const { verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/", getAllPrompts);
router.post("/", createPrompt);
router.put("/:id", updatePrompt);
router.delete("/:id", deletePrompt);

module.exports = router;
