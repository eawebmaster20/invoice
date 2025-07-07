const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, validateRequest } = require("../middleware");
const { clientSchema } = require("../validators/schemas");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     ClientInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Client name
 *         email:
 *           type: string
 *           format: email
 *           description: Client email
 *         phone:
 *           type: string
 *           description: Client phone number
 *         address:
 *           type: string
 *           description: Client address
 *         city:
 *           type: string
 *           description: Client city
 *         postalCode:
 *           type: string
 *           description: Client postal code
 *         country:
 *           type: string
 *           description: Client country
 *         taxId:
 *           type: string
 *           description: Client tax ID
 *         notes:
 *           type: string
 *           description: Additional notes
 */

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Client created successfully
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create client
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch clients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * POST /api/clients
 * Create a new client
 */
router.post("/", validateRequest(clientSchema), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      taxId,
      notes,
    } = req.body;

    const [result] = await pool.execute(
      `
      INSERT INTO clients (
        name, email, phone, address, city, postal_code, country, tax_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        email || null,
        phone || null,
        address || null,
        city || null,
        postalCode || null,
        country || null,
        taxId || null,
        notes || null,
      ]
    );

    res.status(201).json({
      message: "Client created successfully",
      client: {
        id: result.insertId,
        name,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        taxId,
        notes,
      },
    });
  } catch (error) {
    console.error("Client creation error:", error);
    res.status(500).json({
      error: "Failed to create client",
      message: error.message,
    });
  }
});

/**
 * GET /api/clients
 * Get all clients for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const [clients] = await pool.execute(
      "SELECT * FROM clients ORDER BY created_at DESC"
    );

    res.json({
      clients: clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        postalCode: client.postal_code,
        country: client.country,
        taxId: client.tax_id,
        notes: client.notes,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      })),
    });
  } catch (error) {
    console.error("Clients fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch clients",
      message: error.message,
    });
  }
});

/**
 * GET /api/clients/:id
 * Get a specific client by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const clientId = req.params.id;

    const [clients] = await pool.execute("SELECT * FROM clients WHERE id = ?", [
      clientId,
    ]);

    if (clients.length === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    const client = clients[0];

    res.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        postalCode: client.postal_code,
        country: client.country,
        taxId: client.tax_id,
        notes: client.notes,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
    });
  } catch (error) {
    console.error("Client fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch client",
      message: error.message,
    });
  }
});

/**
 * PUT /api/clients/:id
 * Update a client
 */
router.put("/:id", validateRequest(clientSchema), async (req, res) => {
  try {
    const clientId = req.params.id;
    const {
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      taxId,
      notes,
    } = req.body;

    const [result] = await pool.execute(
      `
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, address = ?, city = ?, 
          postal_code = ?, country = ?, tax_id = ?, notes = ?
      WHERE id = ?
    `,
      [
        name,
        email || null,
        phone || null,
        address || null,
        city || null,
        postalCode || null,
        country || null,
        taxId || null,
        notes || null,
        clientId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    res.json({
      message: "Client updated successfully",
      client: {
        id: parseInt(clientId),
        name,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        taxId,
        notes,
      },
    });
  } catch (error) {
    console.error("Client update error:", error);
    res.status(500).json({
      error: "Failed to update client",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client
 */
router.delete("/:id", async (req, res) => {
  try {
    const clientId = req.params.id;

    // Check if client has any invoices
    const [invoices] = await pool.execute(
      "SELECT id FROM invoices WHERE client_id = ?",
      [clientId]
    );

    if (invoices.length > 0) {
      return res.status(400).json({
        error: "Cannot delete client",
        message:
          "This client has existing invoices. Please delete the invoices first.",
      });
    }

    const [result] = await pool.execute("DELETE FROM clients WHERE id = ?", [
      clientId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    res.json({
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Client deletion error:", error);
    res.status(500).json({
      error: "Failed to delete client",
      message: error.message,
    });
  }
});

/**
 * GET /api/clients/:id/invoices
 * Get all invoices for a specific client
 */
router.get("/:id/invoices", async (req, res) => {
  try {
    const clientId = req.params.id;

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

    const [invoices] = await pool.execute(
      `
      SELECT 
        i.*,
        bf.company_name as bill_from_company_name,
        bf.address as bill_from_address,
        bf.city as bill_from_city,
        bf.postal_code as bill_from_postal_code,
        bf.country as bill_from_country,
        bf.email as bill_from_email,
        bf.phone as bill_from_phone
      FROM invoices i
      LEFT JOIN bill_from_addresses bf ON i.bill_from_id = bf.id
      WHERE i.client_id = ?
      ORDER BY i.created_at DESC
    `,
      [clientId]
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
    console.error("Client invoices fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch client invoices",
      message: error.message,
    });
  }
});

module.exports = router;
