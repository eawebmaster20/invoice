module.exports = (sequelize, DataTypes) => {
  const PaymentDetail = sequelize.define(
    "PaymentDetail",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "clients",
          key: "id",
        },
      },
      invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "invoices",
          key: "id",
        },
      },
      method: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      swift_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "payment_details",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  PaymentDetail.associate = function (models) {
    PaymentDetail.belongsTo(models.Client, { foreignKey: "client_id" });
    PaymentDetail.belongsTo(models.Invoice, { foreignKey: "invoice_id" });
  };

  return PaymentDetail;
};
