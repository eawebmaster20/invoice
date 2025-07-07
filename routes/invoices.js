const express = require("express");
const { pool } = require("../config/database");
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      clientId,
      billFromId,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status = "pending",
      amountPaid = 0,
      notes,
    } = req.body;

    // Check if invoice number already exists for this user
    const [existingInvoices] = await connection.execute(
      "SELECT id FROM invoices WHERE invoice_number = ? AND user_id = ?",
      [invoiceNumber, req.user.userId]
    );

    if (existingInvoices.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        error: "Invoice number already exists",
        message: "An invoice with this number already exists",
      });
    }

    // Verify client exists
    const [clients] = await connection.execute(
      "SELECT id FROM clients WHERE id = ?",
      [clientId]
    );

    if (clients.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Invalid client",
        message: "The specified client does not exist",
      });
    }

    // Verify bill_from_id belongs to the user
    const [billFromAddresses] = await connection.execute(
      "SELECT id FROM bill_from_addresses WHERE id = ? AND user_id = ?",
      [billFromId, req.user.userId]
    );

    if (billFromAddresses.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Invalid bill from address",
        message:
          "The specified bill from address does not exist or does not belong to you",
      });
    }

    // Create invoice
    const [invoiceResult] = await connection.execute(
      `
      INSERT INTO invoices (
        user_id, client_id, invoice_number, invoice_date, due_date,
        bill_from_id, subtotal, tax_rate, tax_amount, total, status, amount_paid, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        req.user.userId,
        clientId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        billFromId,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status,
        amountPaid,
        notes || "",
      ]
    );

    const invoiceId = invoiceResult.insertId;

    // Create invoice items
    for (const item of items) {
      await connection.execute(
        "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)",
        [invoiceId, item.description, item.quantity, item.unitPrice, item.total]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: {
        id: invoiceId,
        invoiceNumber,
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
    await connection.rollback();
    console.error("Invoice creation error:", error);
    res.status(500).json({
      error: "Failed to create invoice",
      message: error.message,
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/invoices
 * Get all invoices for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const [invoices] = await pool.execute(
      `
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        c.city as client_city,
        c.postal_code as client_postal_code,
        c.country as client_country,
        c.tax_id as client_tax_id,
        bf.company_name as bill_from_company_name,
        bf.address as bill_from_address,
        bf.city as bill_from_city,
        bf.postal_code as bill_from_postal_code,
        bf.country as bill_from_country,
        bf.email as bill_from_email,
        bf.phone as bill_from_phone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN bill_from_addresses bf ON i.bill_from_id = bf.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `,
      [req.user.userId]
    );

    // Get items for each invoice
    for (const invoice of invoices) {
      const [items] = await pool.execute(
        "SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = ?",
        [invoice.id]
      );
      invoice.items = items;
    }

    res.json({
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        client: {
          id: invoice.client_id,
          name: invoice.client_name,
          email: invoice.client_email,
          phone: invoice.client_phone,
          address: invoice.client_address,
          city: invoice.client_city,
          postalCode: invoice.client_postal_code,
          country: invoice.client_country,
          taxId: invoice.client_tax_id,
        },
        billFrom: {
          companyName: invoice.bill_from_company_name,
          address: invoice.bill_from_address,
          city: invoice.bill_from_city,
          postalCode: invoice.bill_from_postal_code,
          country: invoice.bill_from_country,
          email: invoice.bill_from_email,
          phone: invoice.bill_from_phone,
        },
        items: invoice.items.map((item) => ({
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

    const [invoices] = await pool.execute(
      `
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        c.city as client_city,
        c.postal_code as client_postal_code,
        c.country as client_country,
        c.tax_id as client_tax_id,
        bf.company_name as bill_from_company_name,
        bf.address as bill_from_address,
        bf.city as bill_from_city,
        bf.postal_code as bill_from_postal_code,
        bf.country as bill_from_country,
        bf.email as bill_from_email,
        bf.phone as bill_from_phone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN bill_from_addresses bf ON i.bill_from_id = bf.id
      WHERE i.id = ? AND i.user_id = ?
    `,
      [invoiceId, req.user.userId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    const invoice = invoices[0];

    // Get invoice items
    const [items] = await pool.execute(
      "SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = ?",
      [invoice.id]
    );

    res.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        client: {
          id: invoice.client_id,
          name: invoice.client_name,
          email: invoice.client_email,
          phone: invoice.client_phone,
          address: invoice.client_address,
          city: invoice.client_city,
          postalCode: invoice.client_postal_code,
          country: invoice.client_country,
          taxId: invoice.client_tax_id,
        },
        billFrom: {
          companyName: invoice.bill_from_company_name,
          address: invoice.bill_from_address,
          city: invoice.bill_from_city,
          postalCode: invoice.bill_from_postal_code,
          country: invoice.bill_from_country,
          email: invoice.bill_from_email,
          phone: invoice.bill_from_phone,
        },
        items: items.map((item) => ({
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

    const [result] = await pool.execute(
      "DELETE FROM invoices WHERE id = ? AND user_id = ?",
      [invoiceId, req.user.userId]
    );

    if (result.affectedRows === 0) {
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

      const [result] = await pool.execute(
        `UPDATE invoices 
       SET status = ?, amount_paid = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
        [status, amountPaid, notes || null, invoiceId, req.user.userId]
      );

      if (result.affectedRows === 0) {
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
