const express = require("express");

const { getProfile, updateProfile } = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// GET PROFILE
router.get("/profile", protect, getProfile);

// UPDATE PROFILE
router.put("/profile", protect, upload.single("profileImage"), updateProfile);

module.exports = router;
