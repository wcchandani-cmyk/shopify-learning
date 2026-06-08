const { Sequelize } = require("sequelize");
const {
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
} = require("./constants");

const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
  pool: {
    max: 5,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
