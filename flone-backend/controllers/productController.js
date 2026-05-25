const { Op } = require('sequelize');
const {
  Product, ProductImage, ProductCategory, ProductTag, ProductVariation, VariationSize,
} = require('../schema');

// Full include list for a populated product response
const fullIncludes = [
  { model: ProductImage,    as: 'images',     attributes: ['url', 'position'] },
  { model: ProductCategory, as: 'categories', attributes: ['categoryName'] },
  { model: ProductTag,      as: 'tags',       attributes: ['tag'] },
  {
    model: ProductVariation, as: 'variation', attributes: ['id', 'color', 'image'],
    include: [{ model: VariationSize, as: 'size', attributes: ['name', 'stock'] }],
  },
];

// Map Sequelize row to the shape the frontend expects
function formatProduct(p) {
  const d = p.toJSON();
  return {
    id:               d.id,
    sku:              d.sku,
    name:             d.name,
    price:            parseFloat(d.price),
    discount:         d.discount,
    offerEnd:         d.offerEnd,
    new:              d.isNew,
    rating:           parseFloat(d.rating),
    saleCount:        d.saleCount,
    stock:            d.stock,
    shortDescription: d.shortDescription,
    fullDescription:  d.fullDescription,
    category:  (d.categories || []).map((c) => c.categoryName),
    tag:       (d.tags       || []).map((t) => t.tag),
    image:     (d.images     || []).sort((a, b) => a.position - b.position).map((i) => i.url),
    variation: (d.variation  || []).map((v) => ({
      color: v.color,
      image: v.image,
      size:  (v.size || []).map((s) => ({ name: s.name, stock: s.stock })),
    })),
  };
}

exports.getProducts = async (req, res, next) => {
  try {
    const { category, tag, color, size, type, sort, search, minPrice, maxPrice } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 12);
    const offset = (page - 1) * limit;

    const where = {};

    // Scalar filters
    if (type === 'new')       where.isNew    = true;
    if (type === 'saleItems') where.discount = { [Op.gt]: 0 };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (search) {
      where[Op.or] = [
        { name:             { [Op.like]: `%${search}%` } },
        { shortDescription: { [Op.like]: `%${search}%` } },
      ];
    }

    // Array filters: get matching product IDs via subqueries to avoid JOIN pagination issues
    if (category) {
      const rows = await ProductCategory.findAll({ where: { categoryName: category }, attributes: ['productId'] });
      where.id = { ...(where.id || {}), [Op.in]: rows.map((r) => r.productId) };
    }
    if (tag) {
      const rows = await ProductTag.findAll({ where: { tag }, attributes: ['productId'] });
      const ids  = rows.map((r) => r.productId);
      where.id   = where.id ? { [Op.and]: [where.id, { [Op.in]: ids }] } : { [Op.in]: ids };
    }
    if (color) {
      const rows = await ProductVariation.findAll({ where: { color }, attributes: ['productId'] });
      const ids  = rows.map((r) => r.productId);
      where.id   = where.id ? { [Op.and]: [where.id, { [Op.in]: ids }] } : { [Op.in]: ids };
    }
    if (size) {
      const sizeRows = await VariationSize.findAll({ where: { name: size }, attributes: ['variationId'] });
      const varIds   = sizeRows.map((r) => r.variationId);
      const varRows  = await ProductVariation.findAll({ where: { id: { [Op.in]: varIds } }, attributes: ['productId'] });
      const ids      = varRows.map((r) => r.productId);
      where.id       = where.id ? { [Op.and]: [where.id, { [Op.in]: ids }] } : { [Op.in]: ids };
    }

    let order = [];
    if (sort === 'priceHighToLow')      order = [['price', 'DESC']];
    else if (sort === 'priceLowToHigh') order = [['price', 'ASC']];
    else if (type === 'bestSeller')     order = [['saleCount', 'DESC']];

    const { count, rows } = await Product.findAndCountAll({
      where, order, limit, offset, include: fullIncludes, distinct: true,
    });

    res.json({
      products:   rows.map(formatProduct),
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: fullIncludes });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: formatProduct(product) });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { new: isNew, category, tag, image, variation, ...rest } = req.body;
    const product = await Product.create({ ...rest, isNew });

    await _createChildren(product.id, { category, tag, image, variation });

    const full = await Product.findByPk(product.id, { include: fullIncludes });
    res.status(201).json({ product: formatProduct(full) });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { new: isNew, category, tag, image, variation, ...rest } = req.body;

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.update({ ...rest, ...(isNew !== undefined && { isNew }) });

    // Replace child rows when provided
    if (category !== undefined) {
      await ProductCategory.destroy({ where: { productId: product.id } });
      await _createCategories(product.id, category);
    }
    if (tag !== undefined) {
      await ProductTag.destroy({ where: { productId: product.id } });
      await _createTags(product.id, tag);
    }
    if (image !== undefined) {
      await ProductImage.destroy({ where: { productId: product.id } });
      await _createImages(product.id, image);
    }
    if (variation !== undefined) {
      await ProductVariation.destroy({ where: { productId: product.id } }); // cascades sizes
      await _createVariations(product.id, variation);
    }

    const full = await Product.findByPk(product.id, { include: fullIncludes });
    res.json({ product: formatProduct(full) });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── Child-row helpers ────────────────────────────────────────────────────────

async function _createImages(productId, images = []) {
  await ProductImage.bulkCreate(
    images.map((url, position) => ({ productId, url, position }))
  );
}

async function _createCategories(productId, categories = []) {
  await ProductCategory.bulkCreate(
    categories.map((categoryName) => ({ productId, categoryName }))
  );
}

async function _createTags(productId, tags = []) {
  await ProductTag.bulkCreate(
    tags.map((tag) => ({ productId, tag }))
  );
}

async function _createVariations(productId, variations = []) {
  for (const v of variations) {
    const pv = await ProductVariation.create({ productId, color: v.color, image: v.image });
    if (v.size?.length) {
      await VariationSize.bulkCreate(
        v.size.map((s) => ({ variationId: pv.id, name: s.name, stock: s.stock }))
      );
    }
  }
}

async function _createChildren(productId, { category, tag, image, variation }) {
  await Promise.all([
    _createImages(productId, image),
    _createCategories(productId, category),
    _createTags(productId, tag),
    _createVariations(productId, variation),
  ]);
}
