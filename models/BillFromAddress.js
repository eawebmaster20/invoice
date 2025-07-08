module.exports = (sequelize, DataTypes) => {
  const BillFromAddress = sequelize.define(
    "BillFromAddress",
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
      company_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: "bill_from_addresses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  BillFromAddress.associate = function (models) {
    BillFromAddress.belongsTo(models.User, { foreignKey: "user_id" });
    BillFromAddress.hasMany(models.Invoice, { foreignKey: "bill_from_id" });
  };

  return BillFromAddress;
};
