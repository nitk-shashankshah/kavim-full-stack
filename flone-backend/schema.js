const { DataTypes } = require('sequelize');
const { sequelize } = require('./config/db');

// ─── Product ──────────────────────────────────────────────────────────────────
// Nested arrays (images, categories, tags, variations) are stored in child tables.

const Product = sequelize.define('Product', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sku:              { type: DataTypes.STRING(100), allowNull: false, unique: true },
  name:             { type: DataTypes.STRING(500), allowNull: false },
  price:            { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  discount:         { type: DataTypes.INTEGER, defaultValue: 0 },
  offerEnd:         { type: DataTypes.STRING(100) },
  isNew:            { type: DataTypes.BOOLEAN, defaultValue: false },
  rating:           { type: DataTypes.DECIMAL(3, 1), defaultValue: 0 },
  saleCount:        { type: DataTypes.INTEGER, defaultValue: 0 },
  stock:            { type: DataTypes.INTEGER, defaultValue: 0 },
  shortDescription: { type: DataTypes.TEXT },
  fullDescription:  { type: DataTypes.TEXT },
}, { tableName: 'products', timestamps: true });

// One row per image URL, ordered by position
const ProductImage = sequelize.define('ProductImage', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  url:       { type: DataTypes.STRING(1000), allowNull: false },
  position:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'product_images', timestamps: false });

// Junction: product ↔ category name (allows multi-category products)
const ProductCategory = sequelize.define('ProductCategory', {
  productId:    { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  categoryName: { type: DataTypes.STRING(100), allowNull: false, primaryKey: true },
}, { tableName: 'product_categories', timestamps: false });

// Junction: product ↔ tag string
const ProductTag = sequelize.define('ProductTag', {
  productId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  tag:       { type: DataTypes.STRING(100), allowNull: false, primaryKey: true },
}, { tableName: 'product_tags', timestamps: false });

// One row per colour variant
const ProductVariation = sequelize.define('ProductVariation', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  color:     { type: DataTypes.STRING(100), allowNull: false },
  image:     { type: DataTypes.STRING(1000), allowNull: false },
}, { tableName: 'product_variations', timestamps: false });

// One row per size within a colour variant
const VariationSize = sequelize.define('VariationSize', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  variationId: { type: DataTypes.INTEGER, allowNull: false },
  name:        { type: DataTypes.STRING(50), allowNull: false },
  stock:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'variation_sizes', timestamps: false });

// ─── Category ─────────────────────────────────────────────────────────────────

const Category = sequelize.define('Category', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  displayName: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  image:       { type: DataTypes.STRING(1000) },
}, { tableName: 'categories', timestamps: true });

// ─── User ─────────────────────────────────────────────────────────────────────

const User = sequelize.define('User', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  email:    { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role:     {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'customer',
    validate:     { isIn: [['customer', 'admin']] },
  },
}, { tableName: 'users', timestamps: true });

// ─── Cart ─────────────────────────────────────────────────────────────────────

const Cart = sequelize.define('Cart', {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
}, { tableName: 'carts', timestamps: true });

const CartItem = sequelize.define('CartItem', {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cartId:               { type: DataTypes.INTEGER, allowNull: false },
  cartItemId:           { type: DataTypes.STRING(36), allowNull: false },
  productId:            { type: DataTypes.INTEGER, allowNull: false },
  quantity:             { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  selectedProductColor: { type: DataTypes.STRING(100) },
  selectedProductSize:  { type: DataTypes.STRING(50) },
}, { tableName: 'cart_items', timestamps: false });

// ─── Order ────────────────────────────────────────────────────────────────────
// Billing fields are flattened into the orders table (no sub-document in SQL).

const Order = sequelize.define('Order', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:        { type: DataTypes.INTEGER, allowNull: false },
  orderNumber:   { type: DataTypes.STRING(100), unique: true },
  // billing
  firstName:     { type: DataTypes.STRING(100), allowNull: false },
  lastName:      { type: DataTypes.STRING(100), allowNull: false },
  company:       { type: DataTypes.STRING(200) },
  country:       { type: DataTypes.STRING(100), allowNull: false },
  streetAddress: { type: DataTypes.STRING(500), allowNull: false },
  city:          { type: DataTypes.STRING(100), allowNull: false },
  state:         { type: DataTypes.STRING(100) },
  postcode:      { type: DataTypes.STRING(20), allowNull: false },
  phone:         { type: DataTypes.STRING(50), allowNull: false },
  billingEmail:  { type: DataTypes.STRING(255), allowNull: false },
  orderNotes:    { type: DataTypes.TEXT },
  // financials
  total:   { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status:  {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'pending',
    validate:     { isIn: [['pending', 'processing', 'shipped', 'delivered', 'cancelled']] },
  },
}, { tableName: 'orders', timestamps: true });

// Price/name are snapshotted at order time so history is immutable after product edits
const OrderItem = sequelize.define('OrderItem', {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId:              { type: DataTypes.INTEGER, allowNull: false },
  productId:            { type: DataTypes.INTEGER, allowNull: false },
  name:                 { type: DataTypes.STRING(500), allowNull: false },
  price:                { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  discount:             { type: DataTypes.INTEGER, defaultValue: 0 },
  quantity:             { type: DataTypes.INTEGER, allowNull: false },
  selectedProductColor: { type: DataTypes.STRING(100) },
  selectedProductSize:  { type: DataTypes.STRING(50) },
  image:                { type: DataTypes.STRING(1000) },
}, { tableName: 'order_items', timestamps: false });

// ─── Wishlist ─────────────────────────────────────────────────────────────────

const Wishlist = sequelize.define('Wishlist', {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
}, { tableName: 'wishlists', timestamps: true });

const WishlistItem = sequelize.define('WishlistItem', {
  wishlistId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  productId:  { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
}, { tableName: 'wishlist_items', timestamps: false });

// ─── Associations ─────────────────────────────────────────────────────────────

Product.hasMany(ProductImage,     { foreignKey: 'productId', as: 'images',     onDelete: 'CASCADE' });
Product.hasMany(ProductCategory,  { foreignKey: 'productId', as: 'categories', onDelete: 'CASCADE' });
Product.hasMany(ProductTag,       { foreignKey: 'productId', as: 'tags',       onDelete: 'CASCADE' });
Product.hasMany(ProductVariation, { foreignKey: 'productId', as: 'variation',  onDelete: 'CASCADE' });
ProductImage.belongsTo(Product,     { foreignKey: 'productId' });
ProductCategory.belongsTo(Product,  { foreignKey: 'productId' });
ProductTag.belongsTo(Product,       { foreignKey: 'productId' });
ProductVariation.belongsTo(Product, { foreignKey: 'productId' });

ProductVariation.hasMany(VariationSize, { foreignKey: 'variationId', as: 'size', onDelete: 'CASCADE' });
VariationSize.belongsTo(ProductVariation, { foreignKey: 'variationId' });

User.hasOne(Cart,     { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Order,   { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasOne(Wishlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User,     { foreignKey: 'userId' });
Order.belongsTo(User,    { foreignKey: 'userId' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });

Cart.hasMany(CartItem,  { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart,    { foreignKey: 'cartId' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order,   { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Wishlist.belongsToMany(Product, { through: WishlistItem, foreignKey: 'wishlistId', otherKey: 'productId', as: 'products' });
Product.belongsToMany(Wishlist, { through: WishlistItem, foreignKey: 'productId',  otherKey: 'wishlistId' });

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  sequelize,
  Product, ProductImage, ProductCategory, ProductTag, ProductVariation, VariationSize,
  Category,
  User,
  Cart, CartItem,
  Order, OrderItem,
  Wishlist, WishlistItem,
};
