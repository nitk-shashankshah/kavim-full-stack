require('dotenv').config();
const {
  sequelize,
  Product,
  ProductImage,
  ProductCategory,
  ProductTag,
  ProductVariation,
  Category,
} = require('../schema');

async function addProduct() {
  await sequelize.authenticate();

  const sku = 'heritage-elephant-serveware';
  const existing = await Product.findOne({ where: { sku } });
  if (existing) {
    console.log(`Product with SKU ${sku} already exists (id=${existing.id}).`);
    await sequelize.close();
    return;
  }

  const product = await Product.create({
    sku,
    name: 'Heritage Elephant Serveware',
    price: 58.99,
    discount: 10,
    offerEnd: 'December 31, 2026 23:59:59',
    isNew: true,
    rating: 4.9,
    saleCount: 0,
    stock: 24,
    shortDescription: 'A beautifully crafted Heritage Elephant Serveware set with rich heritage motifs and premium finish.',
    fullDescription: 'Bring heritage charm to your table with this elephant-inspired serveware collection. Each piece features hand-finished detailing, durable construction, and an elegant design that elevates entertaining, dining, and gifting.',
  });

  const images = [
    '/assets/img/product/handmade/1.jpg',
    '/assets/img/product/handmade/2.jpg',
    '/assets/img/product/handmade/3.jpg',
    '/assets/img/product/handmade/4.jpg',
  ];

  await ProductImage.bulkCreate(
    images.map((url, position) => ({ productId: product.id, url, position }))
  );

  const categories = ['home', 'decor', 'handmade'];
  await ProductCategory.bulkCreate(
    categories.map((categoryName) => ({ productId: product.id, categoryName }))
  );

  const tags = ['heritage', 'elephant', 'serveware', 'decor', 'gift'];
  await ProductTag.bulkCreate(
    tags.map((tag) => ({ productId: product.id, tag }))
  );

  await ProductVariation.create({
    productId: product.id,
    color: 'Heritage',
    image: '/assets/img/product/handmade/1.jpg',
  });

  for (const categoryName of categories) {
    await Category.findOrCreate({
      where: { name: categoryName },
      defaults: { displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1) },
    });
  }

  console.log(`Created product ${product.name} with id=${product.id}`);
  await sequelize.close();
}

addProduct().catch((err) => {
  console.error(err);
  process.exit(1);
});
