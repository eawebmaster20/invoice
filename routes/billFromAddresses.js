const express = require("express");
const db = require("../models");
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

    const billFromAddress = await db.BillFromAddress.create({
      user_id: req.user.userId,
      company_name: companyName,
      address,
      city,
      postal_code: postalCode,
      country,
      email,
      phone,
    });

    res.status(201).json({
      message: "Bill from address created successfully",
      billFromAddress: {
        id: billFromAddress.id,
        companyName: billFromAddress.company_name,
        address: billFromAddress.address,
        city: billFromAddress.city,
        postalCode: billFromAddress.postal_code,
        country: billFromAddress.country,
        email: billFromAddress.email,
        phone: billFromAddress.phone,
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
    const addresses = await db.BillFromAddress.findAll({
      where: { user_id: req.user.userId },
      order: [["created_at", "DESC"]],
    });

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

    const address = await db.BillFromAddress.findOne({
      where: { id: addressId, user_id: req.user.userId },
    });

    if (!address) {
      return res.status(404).json({
        error: "Bill from address not found",
      });
    }

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

    const [updatedRows] = await db.BillFromAddress.update(
      {
        company_name: companyName,
        address,
        city,
        postal_code: postalCode,
        country,
        email,
        phone,
      },
      {
        where: { id: addressId, user_id: req.user.userId },
      }
    );

    if (updatedRows === 0) {
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
    const invoiceCount = await db.Invoice.count({
      where: { bill_from_id: addressId, user_id: req.user.userId },
    });

    if (invoiceCount > 0) {
      return res.status(400).json({
        error: "Cannot delete address",
        message: "This address is being used in existing invoices",
      });
    }

    const deletedRows = await db.BillFromAddress.destroy({
      where: { id: addressId, user_id: req.user.userId },
    });

    if (deletedRows === 0) {
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
