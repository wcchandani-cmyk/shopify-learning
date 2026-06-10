const Shop = require("../modules/shop/model");
const Product = require("../modules/product/model");
const Variant = require("../modules/variant/model");
const Customer = require("../modules/customer/model");
const CustomerComment = require("../modules/customer/commentModel");

Shop.hasMany(Product, {
  foreignKey: "shopId",
  as: "products",
  onDelete: "CASCADE",
});
Product.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

Shop.hasMany(Customer, {
  foreignKey: "shopId",
  as: "customers",
  onDelete: "CASCADE",
});
Customer.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

Product.hasMany(Variant, {
  foreignKey: "productId",
  as: "variants",
  onDelete: "CASCADE",
});
Variant.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

Customer.hasMany(CustomerComment, {
  foreignKey: "customerId",
  as: "comments",
  onDelete: "CASCADE",
});
CustomerComment.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

Shop.hasMany(CustomerComment, {
  foreignKey: "shopId",
  as: "customerComments",
  onDelete: "CASCADE",
});
CustomerComment.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

module.exports = { Shop, Product, Variant, Customer, CustomerComment };
