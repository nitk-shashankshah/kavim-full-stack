const { v4: uuidv4 } = require('uuid');
const { Cart, CartItem, Product, ProductImage, ProductCategory, ProductTag, ProductVariation, VariationSize } = require('../schema');

const productIncludes = [
  { model: ProductImage,    as: 'images',     attributes: ['url', 'position'] },
  { model: ProductCategory, as: 'categories', attributes: ['categoryName'] },
  { model: ProductTag,      as: 'tags',       attributes: ['tag'] },
  {
    model: ProductVariation, as: 'variation', attributes: ['id', 'color', 'image'],
    include: [{ model: VariationSize, as: 'size', attributes: ['name', 'stock'] }],
  },
];

const cartIncludes = [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product', include: productIncludes }] }];

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id }, include: cartIncludes });
    res.json({ items: cart?.items || [] });
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1, selectedProductColor, selectedProductSize } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const [cart] = await Cart.findOrCreate({ where: { userId: req.user.id } });

    const existing = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
        selectedProductColor: selectedProductColor || null,
        selectedProductSize:  selectedProductSize  || null,
      },
    });

    if (existing) {
      await existing.increment('quantity', { by: quantity });
    } else {
      await CartItem.create({
        cartId: cart.id,
        cartItemId: uuidv4(),
        productId,
        quantity,
        selectedProductColor: selectedProductColor || null,
        selectedProductSize:  selectedProductSize  || null,
      });
    }

    const updated = await Cart.findByPk(cart.id, { include: cartIncludes });
    res.json({ items: updated.items });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = await CartItem.findOne({ where: { cartId: cart.id, cartItemId: req.params.cartItemId } });
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    await item.update({ quantity });
    const updated = await Cart.findByPk(cart.id, { include: cartIncludes });
    res.json({ items: updated.items });
  } catch (err) {
    next(err);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    await CartItem.destroy({ where: { cartId: cart.id, cartItemId: req.params.cartItemId } });
    const updated = await Cart.findByPk(cart.id, { include: cartIncludes });
    res.json({ items: updated.items });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
    res.json({ items: [] });
  } catch (err) {
    next(err);
  }
};
