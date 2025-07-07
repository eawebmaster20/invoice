const express = require("express");
const { pool } = require("../config/database");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");
const { validateRequest } = require("../middleware");
const {
  userRegistrationSchema,
  userLoginSchema,
} = require("../validators/schemas");

const router = express.Router();

/**
 * POST /api/users/register
 * Register a new user
 */
router.post(
  "/register",
  validateRequest(userRegistrationSchema),
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const [existingUsers] = await pool.execute(
        "SELECT id FROM users WHERE email = ? OR username = ?",
        [email, username]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: "User already exists",
          message: "A user with this email or username already exists",
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const [result] = await pool.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, passwordHash]
      );

      // Generate token
      const token = generateToken({
        userId: result.insertId,
        username,
        email,
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: result.insertId,
          username,
          email,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Registration failed",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/users/login
 * Login user
 */
router.post("/login", validateRequest(userLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      "SELECT id, username, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/users/profile
 * Get user profile (requires authentication)
 */
router.get(
  "/profile",
  require("../middleware").authenticateToken,
  async (req, res) => {
    try {
      const [users] = await pool.execute(
        "SELECT id, username, email, created_at FROM users WHERE id = ?",
        [req.user.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      res.json({
        user: users[0],
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({
        error: "Failed to fetch profile",
        message: error.message,
      });
    }
  }
);

module.exports = router;
