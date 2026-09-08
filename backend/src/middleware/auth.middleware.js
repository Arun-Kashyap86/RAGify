const jwt = require("jsonwebtoken");
const config = require("../config/env");
const userModel = require("../models/user.model");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid authorization token",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtError) {
      return res.status(401).json({
        message: "Token has expired or is invalid. Please log in again.",
      });
    }

    const user = await userModel.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Authentication error",
    });
  }
}

module.exports = authMiddleware;
