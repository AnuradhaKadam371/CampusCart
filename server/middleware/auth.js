const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {

  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded.user;

    // Security hardening: blocked users cannot use protected APIs.
    const user = await User.findById(req.user.id).select("isBlocked");
    if (user?.isBlocked) {
      return res.status(403).json({ msg: "Your account is blocked. Contact admin." });
    }

    next();

  } catch (err) {

    res.status(401).json({ msg: "Token is not valid" });

  }

};

module.exports = auth;