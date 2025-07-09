const express = require("express");
const db = require("../models");
const { authenticateToken, validateRequest } = require("../middleware");
const { invoiceSchema, invoiceUpdateSchema } = require("../validators/schemas");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/invoices
 * Create a new invoice
 */
router.post("/", validateRequest(invoiceSchema), async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      invoiceNumber, // This is now optional
      invoiceDate,
      dueDate,
      clientId,
      billFromId, // Now optional
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status = "pending",
      amountPaid = 0,
      notes,
    } = req.body;

    console.log("Creating invoice with clientId:", clientId);

    // If invoiceNumber is provided, check for duplicates
    if (invoiceNumber) {
      const existingInvoice = await db.Invoice.findOne({
        where: { invoice_number: invoiceNumber, user_id: req.user.userId },
        transaction,
      });

      if (existingInvoice) {
        await transaction.rollback();
        return res.status(409).json({
          error: "Invoice number already exists",
          message: "An invoice with this number already exists",
        });
      }
    }

    // Verify client exists (add debugging)
    console.log("Looking for client with ID:", clientId);
    const client = await db.Client.findByPk(clientId);
    console.log("Found client:", client ? client.toJSON() : null);

    if (!client) {
      console.log("Client not found. Available clients:");
      const allClients = await db.Client.findAll();
      console.log(allClients.map((c) => ({ id: c.id, name: c.name })));

      await transaction.rollback();
      return res.status(400).json({
        error: "Invalid client",
        message: "The specified client does not exist",
      });
    }

    // Verify bill_from_id belongs to the user (only if provided)
    if (billFromId) {
      const billFromAddress = await db.BillFromAddress.findOne({
        where: { id: billFromId, user_id: req.user.userId },
        transaction,
      });

      if (!billFromAddress) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Invalid bill from address",
          message:
            "The specified bill from address does not exist or does not belong to you",
        });
      }
    }

    // Create invoice (invoice_number will be auto-generated if not provided)
    const invoice = await db.Invoice.create(
      {
        user_id: req.user.userId,
        client_id: clientId,
        invoice_number: invoiceNumber, // Will be auto-generated if undefined
        invoice_date: invoiceDate,
        due_date: dueDate,
        bill_from_id: billFromId || null, // Can be null
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        status,
        amount_paid: amountPaid,
        notes: notes || "",
      },
      { transaction }
    );

    // Create invoice items
    for (const item of items) {
      await db.InvoiceItem.create(
        {
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
        },
        { transaction }
      );
    }

    await transaction.commit();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number, // Return the auto-generated number
        invoiceDate,
        dueDate,
        clientId,
        billFromId,
        items,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status,
        amountPaid,
        notes,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Invoice creation error:", error);
    res.status(500).json({
      error: "Failed to create invoice",
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices
 * Get all invoices for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const invoices = await db.Invoice.findAll({
      where: { user_id: req.user.userId },
      include: [
        {
          model: db.Client,
          attributes: [
            "name",
            "email",
            "phone",
            "address",
            "city",
            "postal_code",
            "country",
            "tax_id",
          ],
        },
        {
          model: db.BillFromAddress,
          required: false, // Allow null associations
          attributes: [
            "company_name",
            "address",
            "city",
            "postal_code",
            "country",
            "email",
            "phone",
          ],
        },
        {
          model: db.InvoiceItem,
          attributes: ["description", "quantity", "unit_price", "total"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        client: {
          id: invoice.client_id,
          name: invoice.Client.name,
          email: invoice.Client.email,
          phone: invoice.Client.phone,
          address: invoice.Client.address,
          city: invoice.Client.city,
          postalCode: invoice.Client.postal_code,
          country: invoice.Client.country,
          taxId: invoice.Client.tax_id,
        },
        billFrom: invoice.BillFromAddress
          ? {
              companyName: invoice.BillFromAddress.company_name,
              address: invoice.BillFromAddress.address,
              city: invoice.BillFromAddress.city,
              postalCode: invoice.BillFromAddress.postal_code,
              country: invoice.BillFromAddress.country,
              email: invoice.BillFromAddress.email,
              phone: invoice.BillFromAddress.phone,
            }
          : null,
        items: invoice.InvoiceItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          total: parseFloat(item.total),
        })),
        subtotal: parseFloat(invoice.subtotal),
        taxRate: parseFloat(invoice.tax_rate),
        taxAmount: parseFloat(invoice.tax_amount),
        total: parseFloat(invoice.total),
        status: invoice.status,
        amountPaid: parseFloat(invoice.amount_paid),
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      })),
    });
  } catch (error) {
    console.error("Invoices fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch invoices",
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/:id
 * Get a specific invoice by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await db.Invoice.findOne({
      where: { id: invoiceId, user_id: req.user.userId },
      include: [
        {
          model: db.Client,
          attributes: [
            "name",
            "email",
            "phone",
            "address",
            "city",
            "postal_code",
            "country",
            "tax_id",
          ],
        },
        {
          model: db.BillFromAddress,
          required: false, // Allow null associations
          attributes: [
            "company_name",
            "address",
            "city",
            "postal_code",
            "country",
            "email",
            "phone",
          ],
        },
        {
          model: db.InvoiceItem,
          attributes: ["description", "quantity", "unit_price", "total"],
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    res.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        client: {
          id: invoice.client_id,
          name: invoice.Client.name,
          email: invoice.Client.email,
          phone: invoice.Client.phone,
          address: invoice.Client.address,
          city: invoice.Client.city,
          postalCode: invoice.Client.postal_code,
          country: invoice.Client.country,
          taxId: invoice.Client.tax_id,
        },
        billFrom: invoice.BillFromAddress
          ? {
              companyName: invoice.BillFromAddress.company_name,
              address: invoice.BillFromAddress.address,
              city: invoice.BillFromAddress.city,
              postalCode: invoice.BillFromAddress.postal_code,
              country: invoice.BillFromAddress.country,
              email: invoice.BillFromAddress.email,
              phone: invoice.BillFromAddress.phone,
            }
          : null,
        items: invoice.InvoiceItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          total: parseFloat(item.total),
        })),
        subtotal: parseFloat(invoice.subtotal),
        taxRate: parseFloat(invoice.tax_rate),
        taxAmount: parseFloat(invoice.tax_amount),
        total: parseFloat(invoice.total),
        status: invoice.status,
        amountPaid: parseFloat(invoice.amount_paid),
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      },
    });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch invoice",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice
 */
router.delete("/:id", async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const deletedRows = await db.Invoice.destroy({
      where: { id: invoiceId, user_id: req.user.userId },
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    res.json({
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Invoice deletion error:", error);
    res.status(500).json({
      error: "Failed to delete invoice",
      message: error.message,
    });
  }
});

/**
 * PUT /api/invoices/:id/status
 * Update invoice status and amount paid
 */
router.put(
  "/:id/status",
  validateRequest(invoiceUpdateSchema),
  async (req, res) => {
    try {
      const invoiceId = req.params.id;
      const { status, amountPaid, notes } = req.body;

      const [updatedRows] = await db.Invoice.update(
        {
          status,
          amount_paid: amountPaid,
          notes: notes || null,
        },
        {
          where: { id: invoiceId, user_id: req.user.userId },
        }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          error: "Invoice not found",
        });
      }

      res.json({
        message: "Invoice status updated successfully",
        invoice: {
          id: parseInt(invoiceId),
          status,
          amountPaid,
          notes,
        },
      });
    } catch (error) {
      console.error("Invoice status update error:", error);
      res.status(500).json({
        error: "Failed to update invoice status",
        message: error.message,
      });
    }
  }
);

module.exports = router;
