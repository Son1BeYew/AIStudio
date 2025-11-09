const express = require("express");
const router = express.Router();
const serviceConfigController = require("../controllers/serviceConfigController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", serviceConfigController.getAll);
router.get("/:service", serviceConfigController.getByService);
router.put("/:service", verifyToken, serviceConfigController.update);

module.exports = router;
