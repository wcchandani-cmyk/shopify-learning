const Shop = require("../modules/shop/model");
const Product = require("../modules/product/model");
const Variant = require("../modules/variant/model");
const Customer = require("../modules/customer/model");
const Comment = require("../modules/comment/model");
const Discount = require("../modules/discount/model");
const CustomDiscount = require("../modules/customDiscount/model");

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

Customer.hasMany(Comment, {
  foreignKey: "customerId",
  as: "comments",
  onDelete: "CASCADE",
});
Comment.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

Shop.hasMany(Discount, {
  foreignKey: "shopId",
  as: "discounts",
  onDelete: "CASCADE",
});
Discount.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

Discount.hasMany(Comment, {
  foreignKey: "discountId",
  as: "comments",
  onDelete: "CASCADE",
});
Comment.belongsTo(Discount, {
  foreignKey: "discountId",
  as: "discount",
});

Shop.hasMany(Comment, {
  foreignKey: "shopId",
  as: "comments",
  onDelete: "CASCADE",
});
Comment.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

Shop.hasMany(CustomDiscount, {
  foreignKey: "shopId",
  as: "customDiscounts",
  onDelete: "CASCADE",
});
CustomDiscount.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

const {
  MetafieldDefinition,
  Metafield,
} = require("../modules/metafields/model");

Shop.hasMany(MetafieldDefinition, {
  foreignKey: "shopId",
  as: "metafieldDefinitions",
  onDelete: "CASCADE",
});
MetafieldDefinition.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

Shop.hasMany(Metafield, {
  foreignKey: "shopId",
  as: "metafields",
  onDelete: "CASCADE",
});
Metafield.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

MetafieldDefinition.hasMany(Metafield, {
  foreignKey: "definitionId",
  as: "metafields",
  onDelete: "CASCADE",
});
Metafield.belongsTo(MetafieldDefinition, {
  foreignKey: "definitionId",
  as: "definition",
});

module.exports = {
  Shop,
  Product,
  Variant,
  Customer,
  Comment,
  Discount,
  CustomDiscount,
  MetafieldDefinition,
  Metafield,
};



