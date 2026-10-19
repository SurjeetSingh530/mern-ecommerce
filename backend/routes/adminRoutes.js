// const express = require("express");

// const { getAdminStats } = require("../controllers/adminController");

// const { protect, admin } = require("../middleware/authMiddleware");

// const router = express.Router();

// router.get("/stats", protect, admin, getAdminStats);

// module.exports = router;

const express = require("express");

const { getAdminStats } = require("../controllers/adminController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

console.log("protect:", protect);
console.log("admin:", admin);
console.log("getAdminStats:", getAdminStats);

router.get("/stats", protect, admin, getAdminStats);

module.exports = router;
