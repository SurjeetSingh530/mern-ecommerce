const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let stage = "read_bearer_token";
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      console.warn("AUTH_REJECTED", {
        route: req.originalUrl,
        reason: "missing_bearer_token",
      });
      return res.status(401).json({
        message: "Token not found",
        code: "AUTH_TOKEN_MISSING",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("AUTH_CONFIGURATION_MISSING", { route: req.originalUrl });
      return res.status(503).json({
        message: "Authentication is temporarily unavailable",
        code: "AUTH_CONFIGURATION_MISSING",
      });
    }

    stage = "verify_jwt";
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      const isExpired = error.name === "TokenExpiredError";
      const isInvalid = error.name === "JsonWebTokenError";
      const code = isExpired
        ? "AUTH_TOKEN_EXPIRED"
        : isInvalid
          ? "AUTH_TOKEN_INVALID"
          : "AUTH_VERIFICATION_FAILED";
      const status = isExpired || isInvalid ? 401 : 503;

      console.warn("AUTH_REJECTED", {
        route: req.originalUrl,
        stage,
        code,
      });
      return res.status(status).json({
        message: isExpired
          ? "Your session has expired"
          : isInvalid
            ? "Your session token is invalid"
            : "Authentication is temporarily unavailable",
        code,
      });
    }

    stage = "load_user";
    try {
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.error("AUTH_USER_LOOKUP_FAILED", {
        route: req.originalUrl,
        errorName: error.name || "UnknownError",
      });
      return res.status(503).json({
        message: "Authentication is temporarily unavailable",
        code: "AUTH_USER_LOOKUP_FAILED",
      });
    }

    if (!req.user) {
      console.warn("AUTH_REJECTED", {
        route: req.originalUrl,
        reason: "jwt_user_not_found",
      });
      return res.status(401).json({
        message: "User not found",
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    next();
  } catch (error) {
    console.warn("AUTH_REJECTED", {
      route: req.originalUrl,
      stage,
      errorName: error.name || "UnknownError",
    });
    return res.status(401).json({
      message: "Not authorized",
      code: "AUTH_VERIFICATION_FAILED",
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({
      message: "Admin access required",
    });
  }
};

module.exports = {
  protect,
  admin,
};
