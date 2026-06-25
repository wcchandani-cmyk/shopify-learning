require("dotenv").config();
const mysql = require("mysql2/promise");
const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT,
} = require("../config/constants");
const sequelize = require("../config/db");
const {
  Shop,
  Product,
  Variant,
  Customer,
  Discount,
  Order,
  Comment,
  CustomDiscount,
  MetafieldDefinition,
  Metafield,
  CheckoutUpsell,
} = require("../models/associations");

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
  });
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
  console.log(`Database ready: ${DB_DATABASE}`);
}

async function main() {
  await ensureDatabase();
  await sequelize.authenticate();
  console.log("Database connected.");
  const syncOptions = { alter: process.env.DB_SYNC_ALTER === "true" };

  const models = [
    Shop,
    Product,
    Variant,
    Customer,
    Discount,
    Order,
    Comment,
    CustomDiscount,
    MetafieldDefinition,
    Metafield,
    CheckoutUpsell,
  ];
  for (const model of models) {
    await model.sync(syncOptions);
    console.log(`Table created/verified: ${model.tableName}`);
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
