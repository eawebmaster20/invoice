const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const db = {};

// Import models
db.User = require("./User")(sequelize, DataTypes);
db.Client = require("./Client")(sequelize, DataTypes);
db.BillFromAddress = require("./BillFromAddress")(sequelize, DataTypes);
db.Invoice = require("./Invoice")(sequelize, DataTypes);
db.InvoiceItem = require("./InvoiceItem")(sequelize, DataTypes);
db.PaymentDetail = require("./PaymentDetail")(sequelize, DataTypes);

// Define associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
