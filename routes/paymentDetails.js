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
      clientId,
      invoiceId,
      method,
      accountName,
      accountNumber,
      bankName,
      swiftCode,
      isDefault = false,
    } = req.body;

    // Verify client exists
    const [clients] = await pool.execute(
      "SELECT id FROM clients WHERE id = ?",
      [clientId]
    );

    if (clients.length === 0) {
      return res.status(400).json({
        error: "Invalid client",
        message: "The specified client does not exist",
      });
    }

    // If invoiceId is provided, verify it exists and belongs to the client
    if (invoiceId) {
      const [invoices] = await pool.execute(
        "SELECT id FROM invoices WHERE id = ? AND client_id = ?",
        [invoiceId, clientId]
      );

      if (invoices.length === 0) {
        return res.status(400).json({
          error: "Invalid invoice",
          message:
            "The specified invoice does not exist or does not belong to this client",
        });
      }
    }

    // If this is being set as default for the client, unset other defaults
    if (isDefault) {
      await pool.execute(
        "UPDATE payment_details SET is_default = FALSE WHERE client_id = ?",
        [clientId]
      );
    }

    const [result] = await pool.execute(
      `
      INSERT INTO payment_details (
        client_id, invoice_id, method, account_name, account_number, bank_name, swift_code, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        clientId,
        invoiceId || null,
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
        clientId,
        invoiceId,
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
 * GET /api/payment-details/client/:clientId
 * Get all payment details for a specific client
 */
router.get("/client/:clientId", async (req, res) => {
  try {
    const clientId = req.params.clientId;

    // Verify client exists
    const [clients] = await pool.execute(
      "SELECT id FROM clients WHERE id = ?",
      [clientId]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    const [paymentDetails] = await pool.execute(
      "SELECT * FROM payment_details WHERE client_id = ? ORDER BY is_default DESC, created_at DESC",
      [clientId]
    );

    res.json({
      paymentDetails: paymentDetails.map((payment) => ({
        id: payment.id,
        clientId: payment.client_id,
        invoiceId: payment.invoice_id,
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
 * GET /api/payment-details
 * Get all payment details
 */
router.get("/", async (req, res) => {
  try {
    const [paymentDetails] = await pool.execute(
      `SELECT pd.*, c.name as client_name, i.invoice_number 
       FROM payment_details pd 
       LEFT JOIN clients c ON pd.client_id = c.id 
       LEFT JOIN invoices i ON pd.invoice_id = i.id 
       ORDER BY pd.created_at DESC`
    );

    res.json({
      paymentDetails: paymentDetails.map((payment) => ({
        id: payment.id,
        clientId: payment.client_id,
        clientName: payment.client_name,
        invoiceId: payment.invoice_id,
        invoiceNumber: payment.invoice_number,
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
      `SELECT pd.*, c.name as client_name, i.invoice_number 
       FROM payment_details pd 
       LEFT JOIN clients c ON pd.client_id = c.id 
       LEFT JOIN invoices i ON pd.invoice_id = i.id 
       WHERE pd.id = ?`,
      [paymentId]
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
        clientId: payment.client_id,
        clientName: payment.client_name,
        invoiceId: payment.invoice_id,
        invoiceNumber: payment.invoice_number,
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
      clientId,
      invoiceId,
      method,
      accountName,
      accountNumber,
      bankName,
      swiftCode,
      isDefault = false,
    } = req.body;

    // Verify client exists
    const [clients] = await pool.execute(
      "SELECT id FROM clients WHERE id = ?",
      [clientId]
    );

    if (clients.length === 0) {
      return res.status(400).json({
        error: "Invalid client",
        message: "The specified client does not exist",
      });
    }

    // If invoiceId is provided, verify it exists and belongs to the client
    if (invoiceId) {
      const [invoices] = await pool.execute(
        "SELECT id FROM invoices WHERE id = ? AND client_id = ?",
        [invoiceId, clientId]
      );

      if (invoices.length === 0) {
        return res.status(400).json({
          error: "Invalid invoice",
          message:
            "The specified invoice does not exist or does not belong to this client",
        });
      }
    }

    // If this is being set as default for the client, unset other defaults
    if (isDefault) {
      await pool.execute(
        "UPDATE payment_details SET is_default = FALSE WHERE client_id = ? AND id != ?",
        [clientId, paymentId]
      );
    }

    const [result] = await pool.execute(
      `
      UPDATE payment_details 
      SET client_id = ?, invoice_id = ?, method = ?, account_name = ?, account_number = ?, 
          bank_name = ?, swift_code = ?, is_default = ?
      WHERE id = ?
    `,
      [
        clientId,
        invoiceId || null,
        method,
        accountName,
        accountNumber,
        bankName,
        swiftCode,
        isDefault,
        paymentId,
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
        clientId,
        invoiceId,
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
      "DELETE FROM payment_details WHERE id = ?",
      [paymentId]
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
