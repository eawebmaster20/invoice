const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, validateRequest } = require("../middleware");
const { paymentDetailsSchema } = require("../validators/schemas");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/payment-details
 * Create new payment details
 */
router.post("/", validateRequest(paymentDetailsSchema), async (req, res) => {
  try {
    const {
      method,
      accountName,
      accountNumber,
      bankName,
      swiftCode,
      isDefault = false,
    } = req.body;

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await pool.execute(
        "UPDATE payment_details SET is_default = FALSE WHERE user_id = ?",
        [req.user.userId]
      );
    }

    const [result] = await pool.execute(
      `
      INSERT INTO payment_details (
        user_id, method, account_name, account_number, bank_name, swift_code, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        req.user.userId,
        method,
        accountName,
        accountNumber,
        bankName,
        swiftCode,
        isDefault,
      ]
    );

    res.status(201).json({
      message: "Payment details created successfully",
      paymentDetails: {
        id: result.insertId,
        method,
        accountName,
        accountNumber,
        bankName,
        swiftCode,
        isDefault,
      },
    });
  } catch (error) {
    console.error("Payment details creation error:", error);
    res.status(500).json({
      error: "Failed to create payment details",
      message: error.message,
    });
  }
});

/**
 * GET /api/payment-details
 * Get all payment details for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const [paymentDetails] = await pool.execute(
      "SELECT * FROM payment_details WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
      [req.user.userId]
    );

    res.json({
      paymentDetails: paymentDetails.map((payment) => ({
        id: payment.id,
        method: payment.method,
        accountName: payment.account_name,
        accountNumber: payment.account_number,
        bankName: payment.bank_name,
        swiftCode: payment.swift_code,
        isDefault: Boolean(payment.is_default),
        createdAt: payment.created_at,
      })),
    });
  } catch (error) {
    console.error("Payment details fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch payment details",
      message: error.message,
    });
  }
});

/**
 * GET /api/payment-details/:id
 * Get specific payment details by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const paymentId = req.params.id;

    const [paymentDetails] = await pool.execute(
      "SELECT * FROM payment_details WHERE id = ? AND user_id = ?",
      [paymentId, req.user.userId]
    );

    if (paymentDetails.length === 0) {
      return res.status(404).json({
        error: "Payment details not found",
      });
    }

    const payment = paymentDetails[0];

    res.json({
      paymentDetails: {
        id: payment.id,
        method: payment.method,
        accountName: payment.account_name,
        accountNumber: payment.account_number,
        bankName: payment.bank_name,
        swiftCode: payment.swift_code,
        isDefault: Boolean(payment.is_default),
        createdAt: payment.created_at,
      },
    });
  } catch (error) {
    console.error("Payment details fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch payment details",
      message: error.message,
    });
  }
});

/**
 * PUT /api/payment-details/:id
 * Update payment details
 */
router.put("/:id", validateRequest(paymentDetailsSchema), async (req, res) => {
  try {
    const paymentId = req.params.id;
    const {
      method,
      accountName,
      accountNumber,
      bankName,
      swiftCode,
      isDefault = false,
    } = req.body;

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await pool.execute(
        "UPDATE payment_details SET is_default = FALSE WHERE user_id = ? AND id != ?",
        [req.user.userId, paymentId]
      );
    }

    const [result] = await pool.execute(
      `
      UPDATE payment_details 
      SET method = ?, account_name = ?, account_number = ?, 
          bank_name = ?, swift_code = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `,
      [
        method,
        accountName,
        accountNumber,
        bankName,
        swiftCode,
        isDefault,
        paymentId,
        req.user.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Payment details not found",
      });
    }

    res.json({
      message: "Payment details updated successfully",
      paymentDetails: {
        id: parseInt(paymentId),
        method,
        accountName,
        accountNumber,
        bankName,
        swiftCode,
        isDefault,
      },
    });
  } catch (error) {
    console.error("Payment details update error:", error);
    res.status(500).json({
      error: "Failed to update payment details",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/payment-details/:id
 * Delete payment details
 */
router.delete("/:id", async (req, res) => {
  try {
    const paymentId = req.params.id;

    const [result] = await pool.execute(
      "DELETE FROM payment_details WHERE id = ? AND user_id = ?",
      [paymentId, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Payment details not found",
      });
    }

    res.json({
      message: "Payment details deleted successfully",
    });
  } catch (error) {
    console.error("Payment details deletion error:", error);
    res.status(500).json({
      error: "Failed to delete payment details",
      message: error.message,
    });
  }
});

module.exports = router;
