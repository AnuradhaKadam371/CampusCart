const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Report = require("../models/Report");

// User-facing: create report/complaint
router.post("/", auth, async (req, res) => {
  try {
    const { targetType, targetUserId, targetProductId, reason, description } = req.body;
    if (!targetType || !reason) {
      return res.status(400).json({ msg: "targetType and reason are required" });
    }

    if (targetType === "user" && !targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required for user report" });
    }
    if (targetType === "product" && !targetProductId) {
      return res.status(400).json({ msg: "targetProductId is required for product report" });
    }

    const report = await Report.create({
      reporterId: req.user.id,
      targetType,
      targetUserId: targetType === "user" ? targetUserId : null,
      targetProductId: targetType === "product" ? targetProductId : null,
      reason,
      description: description || "",
    });

    res.status(201).json({ msg: "Report submitted", report });
  } catch (err) {
    console.error("Create report error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;

