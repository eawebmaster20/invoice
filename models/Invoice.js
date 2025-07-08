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
