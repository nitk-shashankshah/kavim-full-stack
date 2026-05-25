require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const {
  sequelize,
  Product, ProductImage, ProductCategory, ProductTag, ProductVariation, VariationSize,
  Category,
} = require('../schema');

const PRODUCTS_JSON = path.resolve(__dirname, '../../flone/src/data/products.json');

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // drops and recreates all tables

  const raw = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
  console.log(`Seeding ${raw.length} products…`);

  for (const p of raw) {
    const product = await Product.create({
      sku:              p.sku || `SKU-${p.id}`,
      name:             p.name,
      price:            p.price,
      discount:         p.discount || 0,
      offerEnd:         p.offerEnd || null,
      isNew:            p.new || false,
      rating:           p.rating || 0,
      saleCount:        p.saleCount || 0,
      stock:            p.stock || 0,
      shortDescription: p.shortDescription || null,
      fullDescription:  p.fullDescription  || null,
    });

    if (p.image?.length) {
      await ProductImage.bulkCreate(
        p.image.map((url, position) => ({ productId: product.id, url, position }))
      );
    }
    if (p.category?.length) {
      await ProductCategory.bulkCreate(
        p.category.map((categoryName) => ({ productId: product.id, categoryName }))
      );
    }
    if (p.tag?.length) {
      await ProductTag.bulkCreate(
        p.tag.map((tag) => ({ productId: product.id, tag }))
      );
    }
    if (p.variation?.length) {
      for (const v of p.variation) {
        const pv = await ProductVariation.create({ productId: product.id, color: v.color, image: v.image });
        if (v.size?.length) {
          await VariationSize.bulkCreate(
            v.size.map((s) => ({ variationId: pv.id, name: s.name, stock: s.stock }))
          );
        }
      }
    }
  }

  // Seed standalone categories from unique values in product data
  const allCategoryNames = [...new Set(raw.flatMap((p) => p.category || []))];
  await Category.bulkCreate(
    allCategoryNames.map((name) => ({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
    })),
    { ignoreDuplicates: true }
  );

  console.log(`Done — ${raw.length} products and ${allCategoryNames.length} categories seeded.`);
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
