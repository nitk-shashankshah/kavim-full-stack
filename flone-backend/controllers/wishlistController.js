const { Wishlist, WishlistItem, Product, ProductImage, ProductCategory, ProductTag, ProductVariation, VariationSize } = require('../schema');

const productIncludes = [
  { model: ProductImage,    as: 'images',     attributes: ['url', 'position'] },
  { model: ProductCategory, as: 'categories', attributes: ['categoryName'] },
  { model: ProductTag,      as: 'tags',       attributes: ['tag'] },
  {
    model: ProductVariation, as: 'variation', attributes: ['id', 'color', 'image'],
    include: [{ model: VariationSize, as: 'size', attributes: ['name', 'stock'] }],
  },
];

exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({
      where: { userId: req.user.id },
      include: [{ model: Product, as: 'products', include: productIncludes }],
    });
    res.json({ products: wishlist?.products || [] });
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const [wishlist] = await Wishlist.findOrCreate({ where: { userId: req.user.id } });

    // findOrCreate on the junction to prevent duplicates
    await WishlistItem.findOrCreate({ where: { wishlistId: wishlist.id, productId } });

    const updated = await Wishlist.findByPk(wishlist.id, {
      include: [{ model: Product, as: 'products', include: productIncludes }],
    });
    res.json({ products: updated.products });
  } catch (err) {
    next(err);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ where: { userId: req.user.id } });
    if (!wishlist) return res.json({ products: [] });

    await WishlistItem.destroy({ where: { wishlistId: wishlist.id, productId: req.params.productId } });

    const updated = await Wishlist.findByPk(wishlist.id, {
      include: [{ model: Product, as: 'products', include: productIncludes }],
    });
    res.json({ products: updated.products });
  } catch (err) {
    next(err);
  }
};

exports.clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ where: { userId: req.user.id } });
    if (wishlist) await WishlistItem.destroy({ where: { wishlistId: wishlist.id } });
    res.json({ products: [] });
  } catch (err) {
    next(err);
  }
};
