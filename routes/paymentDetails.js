const express = require("express");
const db = require("../models");
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
    const client = await db.Client.findByPk(clientId);
    if (!client) {
      return res.status(400).json({
        error: "Invalid client",
        message: "The specified client does not exist",
      });
    }

    // If invoiceId is provided, verify it exists and belongs to the client
    if (invoiceId) {
      const invoice = await db.Invoice.findOne({
        where: { id: invoiceId, client_id: clientId },
      });

      if (!invoice) {
        return res.status(400).json({
          error: "Invalid invoice",
          message:
            "The specified invoice does not exist or does not belong to this client",
        });
      }
    }

    // If this is being set as default for the client, unset other defaults
    if (isDefault) {
      await db.PaymentDetail.update(
        { is_default: false },
        { where: { client_id: clientId } }
      );
    }

    const paymentDetail = await db.PaymentDetail.create({
      client_id: clientId,
      invoice_id: invoiceId || null,
      method,
      account_name: accountName,
      account_number: accountNumber,
      bank_name: bankName,
      swift_code: swiftCode,
      is_default: isDefault,
    });

    res.status(201).json({
      message: "Payment details created successfully",
      paymentDetails: {
        id: paymentDetail.id,
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
    const client = await db.Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    const paymentDetails = await db.PaymentDetail.findAll({
      where: { client_id: clientId },
      order: [
        ["is_default", "DESC"],
        ["created_at", "DESC"],
      ],
    });

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
    const paymentDetails = await db.PaymentDetail.findAll({
      include: [
        {
          model: db.Client,
          attributes: ["name"],
        },
        {
          model: db.Invoice,
          attributes: ["invoice_number"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      paymentDetails: paymentDetails.map((payment) => ({
        id: payment.id,
        clientId: payment.client_id,
        clientName: payment.Client ? payment.Client.name : null,
        invoiceId: payment.invoice_id,
        invoiceNumber: payment.Invoice ? payment.Invoice.invoice_number : null,
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

    const paymentDetail = await db.PaymentDetail.findByPk(paymentId, {
      include: [
        {
          model: db.Client,
          attributes: ["name"],
        },
        {
          model: db.Invoice,
          attributes: ["invoice_number"],
        },
      ],
    });

    if (!paymentDetail) {
      return res.status(404).json({
        error: "Payment details not found",
      });
    }

    res.json({
      paymentDetails: {
        id: paymentDetail.id,
        clientId: paymentDetail.client_id,
        clientName: paymentDetail.Client ? paymentDetail.Client.name : null,
        invoiceId: paymentDetail.invoice_id,
        invoiceNumber: paymentDetail.Invoice
          ? paymentDetail.Invoice.invoice_number
          : null,
        method: paymentDetail.method,
        accountName: paymentDetail.account_name,
        accountNumber: paymentDetail.account_number,
        bankName: paymentDetail.bank_name,
        swiftCode: paymentDetail.swift_code,
        isDefault: Boolean(paymentDetail.is_default),
        createdAt: paymentDetail.created_at,
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
    const client = await db.Client.findByPk(clientId);
    if (!client) {
      return res.status(400).json({
        error: "Invalid client",
        message: "The specified client does not exist",
      });
    }

    // If invoiceId is provided, verify it exists and belongs to the client
    if (invoiceId) {
      const invoice = await db.Invoice.findOne({
        where: { id: invoiceId, client_id: clientId },
      });

      if (!invoice) {
        return res.status(400).json({
          error: "Invalid invoice",
          message:
            "The specified invoice does not exist or does not belong to this client",
        });
      }
    }

    // If this is being set as default for the client, unset other defaults
    if (isDefault) {
      await db.PaymentDetail.update(
        { is_default: false },
        {
          where: {
            client_id: clientId,
            id: { [db.Sequelize.Op.ne]: paymentId },
          },
        }
      );
    }

    const [updatedRows] = await db.PaymentDetail.update(
      {
        client_id: clientId,
        invoice_id: invoiceId || null,
        method,
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName,
        swift_code: swiftCode,
        is_default: isDefault,
      },
      { where: { id: paymentId } }
    );

    if (updatedRows === 0) {
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

    const deletedRows = await db.PaymentDetail.destroy({
      where: { id: paymentId },
    });

    if (deletedRows === 0) {
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
