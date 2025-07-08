const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Invoice Server API",
      version: "1.0.0",
      description:
        "A comprehensive Node.js Express server for managing invoices, built with PostgreSQL and Sequelize ORM with JWT authentication.",
      contact: {
        name: "eawebmaster20",
        email: "eawebmaster20@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.example.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            id: {
              type: "integer",
              description: "User ID",
            },
            username: {
              type: "string",
              description: "Username",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "User password",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update date",
            },
          },
        },
        Client: {
          type: "object",
          required: ["name"],
          properties: {
            id: {
              type: "integer",
              description: "Client ID",
            },
            name: {
              type: "string",
              description: "Client name",
            },
            email: {
              type: "string",
              format: "email",
              description: "Client email",
            },
            phone: {
              type: "string",
              description: "Client phone number",
            },
            address: {
              type: "string",
              description: "Client address",
            },
            city: {
              type: "string",
              description: "Client city",
            },
            postalCode: {
              type: "string",
              description: "Client postal code",
            },
            country: {
              type: "string",
              description: "Client country",
            },
            taxId: {
              type: "string",
              description: "Client tax ID",
            },
            notes: {
              type: "string",
              description: "Additional notes",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update date",
            },
          },
        },
        Invoice: {
          type: "object",
          required: [
            "invoiceNumber",
            "invoiceDate",
            "dueDate",
            "clientId",
            "billFromId",
            "items",
            "subtotal",
            "taxRate",
            "taxAmount",
            "total",
          ],
          properties: {
            id: {
              type: "integer",
              description: "Invoice ID",
            },
            invoiceNumber: {
              type: "string",
              description: "Unique invoice number",
            },
            invoiceDate: {
              type: "string",
              format: "date",
              description: "Invoice date",
            },
            dueDate: {
              type: "string",
              format: "date",
              description: "Due date",
            },
            clientId: {
              type: "integer",
              description: "Client ID",
            },
            billFromId: {
              type: "integer",
              description: "Bill from address ID",
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/InvoiceItem",
              },
              description: "Invoice items",
            },
            subtotal: {
              type: "number",
              format: "float",
              description: "Subtotal amount",
            },
            taxRate: {
              type: "number",
              format: "float",
              description: "Tax rate percentage",
            },
            taxAmount: {
              type: "number",
              format: "float",
              description: "Tax amount",
            },
            total: {
              type: "number",
              format: "float",
              description: "Total amount",
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "partially_paid", "overdue"],
              description: "Invoice status",
              default: "pending",
            },
            amountPaid: {
              type: "number",
              format: "float",
              description: "Amount paid",
              default: 0,
            },
            notes: {
              type: "string",
              description: "Additional notes",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update date",
            },
          },
        },
        InvoiceItem: {
          type: "object",
          required: ["description", "quantity", "unitPrice", "total"],
          properties: {
            description: {
              type: "string",
              description: "Item description",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              description: "Item quantity",
            },
            unitPrice: {
              type: "number",
              format: "float",
              minimum: 0,
              description: "Unit price",
            },
            total: {
              type: "number",
              format: "float",
              minimum: 0,
              description: "Total price",
            },
          },
        },
        BillFromAddress: {
          type: "object",
          required: [
            "companyName",
            "address",
            "city",
            "postalCode",
            "country",
            "email",
            "phone",
          ],
          properties: {
            id: {
              type: "integer",
              description: "Bill from address ID",
            },
            companyName: {
              type: "string",
              description: "Company name",
            },
            address: {
              type: "string",
              description: "Address",
            },
            city: {
              type: "string",
              description: "City",
            },
            postalCode: {
              type: "string",
              description: "Postal code",
            },
            country: {
              type: "string",
              description: "Country",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email",
            },
            phone: {
              type: "string",
              description: "Phone number",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation date",
            },
          },
        },
        PaymentDetails: {
          type: "object",
          required: [
            "clientId",
            "method",
            "accountName",
            "accountNumber",
            "bankName",
            "swiftCode",
          ],
          properties: {
            id: {
              type: "integer",
              description: "Payment details ID",
            },
            clientId: {
              type: "integer",
              description: "Client ID",
            },
            invoiceId: {
              type: "integer",
              description: "Invoice ID (optional)",
            },
            method: {
              type: "string",
              description: "Payment method",
            },
            accountName: {
              type: "string",
              description: "Account name",
            },
            accountNumber: {
              type: "string",
              description: "Account number",
            },
            bankName: {
              type: "string",
              description: "Bank name",
            },
            swiftCode: {
              type: "string",
              description: "SWIFT code",
            },
            isDefault: {
              type: "boolean",
              description: "Is default payment method",
              default: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation date",
            },
          },
        },
        InvoiceStatusUpdate: {
          type: "object",
          required: ["status", "amountPaid"],
          properties: {
            status: {
              type: "string",
              enum: ["pending", "paid", "partially_paid", "overdue"],
              description: "Invoice status",
            },
            amountPaid: {
              type: "number",
              format: "float",
              minimum: 0,
              description: "Amount paid",
            },
            notes: {
              type: "string",
              description: "Additional notes",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error type",
            },
            message: {
              type: "string",
              description: "Error message",
            },
            details: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Detailed error messages",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Users",
        description: "User authentication and profile management",
      },
      {
        name: "Clients",
        description: "Client management operations",
      },
      {
        name: "Bill From Addresses",
        description: "Company/sender address management",
      },
      {
        name: "Invoices",
        description: "Invoice creation and management",
      },
      {
        name: "Payment Details",
        description: "Payment information management",
      },
    ],
    paths: {
      "/api/bill-from-addresses": {
        post: {
          tags: ["Bill From Addresses"],
          summary: "Create a new bill from address",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "companyName",
                    "address",
                    "city",
                    "postalCode",
                    "country",
                    "email",
                    "phone",
                  ],
                  properties: {
                    companyName: { type: "string" },
                    address: { type: "string" },
                    city: { type: "string" },
                    postalCode: { type: "string" },
                    country: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Bill from address created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      billFromAddress: {
                        $ref: "#/components/schemas/BillFromAddress",
                      },
                    },
                  },
                },
              },
            },
            401: { description: "Authentication required" },
            500: { description: "Failed to create bill from address" },
          },
        },
        get: {
          tags: ["Bill From Addresses"],
          summary: "Get all bill from addresses for authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Bill from addresses retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      billFromAddresses: {
                        type: "array",
                        items: { $ref: "#/components/schemas/BillFromAddress" },
                      },
                    },
                  },
                },
              },
            },
            401: { description: "Authentication required" },
          },
        },
      },
      "/api/bill-from-addresses/{id}": {
        get: {
          tags: ["Bill From Addresses"],
          summary: "Get a specific bill from address by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Bill from address retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      billFromAddress: {
                        $ref: "#/components/schemas/BillFromAddress",
                      },
                    },
                  },
                },
              },
            },
            404: { description: "Bill from address not found" },
          },
        },
        put: {
          tags: ["Bill From Addresses"],
          summary: "Update a bill from address",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "companyName",
                    "address",
                    "city",
                    "postalCode",
                    "country",
                    "email",
                    "phone",
                  ],
                  properties: {
                    companyName: { type: "string" },
                    address: { type: "string" },
                    city: { type: "string" },
                    postalCode: { type: "string" },
                    country: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Bill from address updated successfully" },
            404: { description: "Bill from address not found" },
          },
        },
        delete: {
          tags: ["Bill From Addresses"],
          summary: "Delete a bill from address",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Bill from address deleted successfully" },
            400: { description: "Cannot delete address - in use by invoices" },
            404: { description: "Bill from address not found" },
          },
        },
      },
      "/api/invoices": {
        post: {
          tags: ["Invoices"],
          summary: "Create a new invoice",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Invoice" },
              },
            },
          },
          responses: {
            201: {
              description: "Invoice created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      invoice: { $ref: "#/components/schemas/Invoice" },
                    },
                  },
                },
              },
            },
            400: { description: "Invalid client or bill from address" },
            409: { description: "Invoice number already exists" },
          },
        },
        get: {
          tags: ["Invoices"],
          summary: "Get all invoices for authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Invoices retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      invoices: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Invoice" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/invoices/{id}": {
        get: {
          tags: ["Invoices"],
          summary: "Get a specific invoice by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Invoice retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      invoice: { $ref: "#/components/schemas/Invoice" },
                    },
                  },
                },
              },
            },
            404: { description: "Invoice not found" },
          },
        },
        delete: {
          tags: ["Invoices"],
          summary: "Delete an invoice",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Invoice deleted successfully" },
            404: { description: "Invoice not found" },
          },
        },
      },
      "/api/invoices/{id}/status": {
        put: {
          tags: ["Invoices"],
          summary: "Update invoice status and amount paid",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InvoiceStatusUpdate" },
              },
            },
          },
          responses: {
            200: { description: "Invoice status updated successfully" },
            404: { description: "Invoice not found" },
          },
        },
      },
      "/api/payment-details": {
        post: {
          tags: ["Payment Details"],
          summary: "Create new payment details",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentDetails" },
              },
            },
          },
          responses: {
            201: {
              description: "Payment details created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      paymentDetails: {
                        $ref: "#/components/schemas/PaymentDetails",
                      },
                    },
                  },
                },
              },
            },
            400: { description: "Invalid client or invoice" },
          },
        },
        get: {
          tags: ["Payment Details"],
          summary: "Get all payment details",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Payment details retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      paymentDetails: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PaymentDetails" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/payment-details/client/{clientId}": {
        get: {
          tags: ["Payment Details"],
          summary: "Get all payment details for a specific client",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "clientId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Payment details retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      paymentDetails: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PaymentDetails" },
                      },
                    },
                  },
                },
              },
            },
            404: { description: "Client not found" },
          },
        },
      },
      "/api/payment-details/{id}": {
        get: {
          tags: ["Payment Details"],
          summary: "Get specific payment details by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Payment details retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      paymentDetails: {
                        $ref: "#/components/schemas/PaymentDetails",
                      },
                    },
                  },
                },
              },
            },
            404: { description: "Payment details not found" },
          },
        },
        put: {
          tags: ["Payment Details"],
          summary: "Update payment details",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentDetails" },
              },
            },
          },
          responses: {
            200: { description: "Payment details updated successfully" },
            404: { description: "Payment details not found" },
          },
        },
        delete: {
          tags: ["Payment Details"],
          summary: "Delete payment details",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Payment details deleted successfully" },
            404: { description: "Payment details not found" },
          },
        },
      },
      "/api/clients/{id}/invoices": {
        get: {
          tags: ["Clients"],
          summary: "Get all invoices for a specific client",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Client invoices retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      invoices: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Invoice" },
                      },
                    },
                  },
                },
              },
            },
            404: { description: "Client not found" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./index.js"],
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
};
