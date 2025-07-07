const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, validateRequest } = require("../middleware");
const { billFromAddressSchema } = require("../validators/schemas");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/bill-from-addresses
 * Create a new bill from address
 */
router.post("/", validateRequest(billFromAddressSchema), async (req, res) => {
  try {
    const { companyName, address, city, postalCode, country, email, phone } =
      req.body;

    const [result] = await pool.execute(
      `
      INSERT INTO bill_from_addresses (
        user_id, company_name, address, city, postal_code, country, email, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        req.user.userId,
        companyName,
        address,
        city,
        postalCode,
        country,
        email,
        phone,
      ]
    );

    res.status(201).json({
      message: "Bill from address created successfully",
      billFromAddress: {
        id: result.insertId,
        companyName,
        address,
        city,
        postalCode,
        country,
        email,
        phone,
      },
    });
  } catch (error) {
    console.error("Bill from address creation error:", error);
    res.status(500).json({
      error: "Failed to create bill from address",
      message: error.message,
    });
  }
});

/**
 * GET /api/bill-from-addresses
 * Get all bill from addresses for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const [addresses] = await pool.execute(
      "SELECT * FROM bill_from_addresses WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.userId]
    );

    res.json({
      billFromAddresses: addresses.map((address) => ({
        id: address.id,
        companyName: address.company_name,
        address: address.address,
        city: address.city,
        postalCode: address.postal_code,
        country: address.country,
        email: address.email,
        phone: address.phone,
        createdAt: address.created_at,
      })),
    });
  } catch (error) {
    console.error("Bill from addresses fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch bill from addresses",
      message: error.message,
    });
  }
});

/**
 * GET /api/bill-from-addresses/:id
 * Get a specific bill from address by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const addressId = req.params.id;

    const [addresses] = await pool.execute(
      "SELECT * FROM bill_from_addresses WHERE id = ? AND user_id = ?",
      [addressId, req.user.userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        error: "Bill from address not found",
      });
    }

    const address = addresses[0];

    res.json({
      billFromAddress: {
        id: address.id,
        companyName: address.company_name,
        address: address.address,
        city: address.city,
        postalCode: address.postal_code,
        country: address.country,
        email: address.email,
        phone: address.phone,
        createdAt: address.created_at,
      },
    });
  } catch (error) {
    console.error("Bill from address fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch bill from address",
      message: error.message,
    });
  }
});

/**
 * PUT /api/bill-from-addresses/:id
 * Update a bill from address
 */
router.put("/:id", validateRequest(billFromAddressSchema), async (req, res) => {
  try {
    const addressId = req.params.id;
    const { companyName, address, city, postalCode, country, email, phone } =
      req.body;

    const [result] = await pool.execute(
      `
      UPDATE bill_from_addresses 
      SET company_name = ?, address = ?, city = ?, postal_code = ?, 
          country = ?, email = ?, phone = ?
      WHERE id = ? AND user_id = ?
    `,
      [
        companyName,
        address,
        city,
        postalCode,
        country,
        email,
        phone,
        addressId,
        req.user.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Bill from address not found",
      });
    }

    res.json({
      message: "Bill from address updated successfully",
      billFromAddress: {
        id: parseInt(addressId),
        companyName,
        address,
        city,
        postalCode,
        country,
        email,
        phone,
      },
    });
  } catch (error) {
    console.error("Bill from address update error:", error);
    res.status(500).json({
      error: "Failed to update bill from address",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/bill-from-addresses/:id
 * Delete a bill from address
 */
router.delete("/:id", async (req, res) => {
  try {
    const addressId = req.params.id;

    // Check if address is being used in any invoices
    const [invoices] = await pool.execute(
      "SELECT id FROM invoices WHERE bill_from_id = ? AND user_id = ?",
      [addressId, req.user.userId]
    );

    if (invoices.length > 0) {
      return res.status(400).json({
        error: "Cannot delete address",
        message: "This address is being used in existing invoices",
      });
    }

    const [result] = await pool.execute(
      "DELETE FROM bill_from_addresses WHERE id = ? AND user_id = ?",
      [addressId, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Bill from address not found",
      });
    }

    res.json({
      message: "Bill from address deleted successfully",
    });
  } catch (error) {
    console.error("Bill from address deletion error:", error);
    res.status(500).json({
      error: "Failed to delete bill from address",
      message: error.message,
    });
  }
});

module.exports = router;
