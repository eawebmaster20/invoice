module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "clients",
          key: "id",
        },
      },
      invoice_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      invoice_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      bill_from_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "bill_from_addresses",
          key: "id",
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "paid", "partially_paid", "overdue"),
        defaultValue: "pending",
      },
      amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "invoices",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      hooks: {
        beforeValidate: async (invoice, options) => {
          console.log("beforeValidate hook triggered");
          console.log("Current invoice_number:", invoice.invoice_number);

          if (!invoice.invoice_number) {
            try {
              console.log("Generating invoice number...");

              // Generate invoice number with pattern: INV-YYYY-MM-NNNN
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, "0");
              const prefix = `INV-${year}-${month}-`;

              console.log("Using prefix:", prefix);

              // Find the last invoice number for this month and year
              const lastInvoice = await sequelize.models.Invoice.findOne({
                where: {
                  invoice_number: {
                    [sequelize.Sequelize.Op.like]: `${prefix}%`,
                  },
                },
                order: [["invoice_number", "DESC"]],
                transaction: options.transaction,
              });

              console.log(
                "Last invoice found:",
                lastInvoice ? lastInvoice.invoice_number : "none"
              );

              let nextNumber = 1;
              if (lastInvoice) {
                // Extract the number part and increment
                const lastNumber = lastInvoice.invoice_number.split("-").pop();
                nextNumber = parseInt(lastNumber) + 1;
              }

              // Pad with zeros to make it 4 digits
              const paddedNumber = String(nextNumber).padStart(4, "0");
              const generatedNumber = `${prefix}${paddedNumber}`;

              console.log("Generated invoice number:", generatedNumber);
              invoice.invoice_number = generatedNumber;

              console.log("Invoice number set to:", invoice.invoice_number);
            } catch (error) {
              console.error("Error in beforeValidate hook:", error);
              // Generate a simple fallback number
              const timestamp = Date.now();
              const fallbackNumber = `INV-${timestamp}`;
              invoice.invoice_number = fallbackNumber;
              console.log("Fallback invoice number:", fallbackNumber);
            }
          }
        },
      },
    }
  );

  Invoice.associate = function (models) {
    Invoice.belongsTo(models.User, { foreignKey: "user_id" });
    Invoice.belongsTo(models.Client, { foreignKey: "client_id" });
    Invoice.belongsTo(models.BillFromAddress, { foreignKey: "bill_from_id" });
    Invoice.hasMany(models.InvoiceItem, { foreignKey: "invoice_id" });
    Invoice.hasMany(models.PaymentDetail, { foreignKey: "invoice_id" });
  };

  return Invoice;
};
