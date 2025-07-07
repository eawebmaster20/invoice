const { verifyToken } = require("../utils/auth");

/**
 * Check if API security is enabled
 */
function isApiSecure() {
  return process.env.API_SECURE !== "false";
}

/**
 * Middleware to authenticate JWT tokens
 * Skips authentication if API_SECURE is set to false
 */
function authenticateToken(req, res, next) {
  // Skip authentication if API_SECURE is false
  if (!isApiSecure()) {
    console.log("⚠️  Authentication bypassed - API_SECURE is disabled");
    // Create a mock user for development purposes
    req.user = {
      userId: 1,
      username: "dev-user",
      email: "dev@example.com",
    };
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Invalid or expired token.",
    });
  }
}

/**
 * Middleware factory for request validation
 * Skips validation if API_SECURE is set to false
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 */
function validateRequest(schema, property = "body") {
  return (req, res, next) => {
    // Skip validation if API_SECURE is false
    if (!isApiSecure()) {
      console.log("⚠️  Validation bypassed - API_SECURE is disabled");
      return next();
    }

    const { error, value } = schema.validate(req[property]);

    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      });
    }

    req[property] = value;
    next();
  };
}

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Database errors
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      error: "Resource already exists",
      message: "A record with this information already exists",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
    });
  }

  // Default error
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
}

/**
 * 404 Not Found middleware
 */
function notFound(req, res) {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

module.exports = {
  authenticateToken,
  validateRequest,
  errorHandler,
  notFound,
  isApiSecure,
};
