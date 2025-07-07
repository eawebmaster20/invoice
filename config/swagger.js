const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Invoice Server API",
      version: "1.0.0",
      description:
        "A comprehensive Node.js Express server for managing invoices, built with MySQL and bcrypt authentication.",
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
            userId: {
              type: "integer",
              description: "User ID who created the invoice",
            },
            clientId: {
              type: "integer",
              description: "Client ID",
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
            billFromId: {
              type: "integer",
              description: "Bill from address ID",
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
            },
            amountPaid: {
              type: "number",
              format: "float",
              description: "Amount paid",
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
            id: {
              type: "integer",
              description: "Invoice item ID",
            },
            invoiceId: {
              type: "integer",
              description: "Invoice ID",
            },
            description: {
              type: "string",
              description: "Item description",
            },
            quantity: {
              type: "integer",
              description: "Item quantity",
            },
            unitPrice: {
              type: "number",
              format: "float",
              description: "Unit price",
            },
            total: {
              type: "number",
              format: "float",
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
            userId: {
              type: "integer",
              description: "User ID",
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
            "invoiceId",
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
              description: "Invoice ID",
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
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation date",
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
