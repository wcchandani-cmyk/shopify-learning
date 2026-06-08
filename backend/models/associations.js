const Shop = require("../modules/shop/model");
const Product = require("../modules/product/model");
const Variant = require("../modules/variant/model");

Shop.hasMany(Product, {
  foreignKey: "shopId",
  as: "products",
  onDelete: "CASCADE",
});
Product.belongsTo(Shop, {
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

module.exports = { Shop, Product, Variant };
