const { sequelize, Cart, CartItem, Product, Order, OrderItem } = require('../schema');

function formatOrder(order) {
  const d = order.toJSON();
  return {
    id:          d.id,
    orderNumber: d.orderNumber,
    status:      d.status,
    total:       parseFloat(d.total),
    createdAt:   d.createdAt,
    billing: {
      firstName:     d.firstName,
      lastName:      d.lastName,
      company:       d.company,
      country:       d.country,
      streetAddress: d.streetAddress,
      city:          d.city,
      state:         d.state,
      postcode:      d.postcode,
      phone:         d.phone,
      email:         d.billingEmail,
      orderNotes:    d.orderNotes,
    },
    items: (d.items || []).map((i) => ({
      productId:            i.productId,
      name:                 i.name,
      price:                parseFloat(i.price),
      discount:             i.discount,
      quantity:             i.quantity,
      selectedProductColor: i.selectedProductColor,
      selectedProductSize:  i.selectedProductSize,
      image:                i.image,
    })),
  };
}

exports.placeOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { billing } = req.body;

    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
      transaction: t,
    });

    if (!cart || !cart.items.length) {
      await t.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let total = 0;
    const orderItems = cart.items.map((item) => {
      const p = item.product;
      const effectivePrice = p.discount > 0 ? p.price - (p.price * p.discount) / 100 : parseFloat(p.price);
      total += effectivePrice * item.quantity;
      return {
        productId:            p.id,
        name:                 p.name,
        price:                parseFloat(p.price),
        discount:             p.discount,
        quantity:             item.quantity,
        selectedProductColor: item.selectedProductColor,
        selectedProductSize:  item.selectedProductSize,
        image:                null,  // images fetched separately; snapshot the primary later if needed
      };
    });

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create({
      userId:        req.user.id,
      orderNumber,
      firstName:     billing.firstName,
      lastName:      billing.lastName,
      company:       billing.company,
      country:       billing.country,
      streetAddress: billing.streetAddress,
      city:          billing.city,
      state:         billing.state,
      postcode:      billing.postcode,
      phone:         billing.phone,
      billingEmail:  billing.email,
      orderNotes:    billing.orderNotes,
      total:         parseFloat(total.toFixed(2)),
      status:        'pending',
    }, { transaction: t });

    await OrderItem.bulkCreate(
      orderItems.map((i) => ({ ...i, orderId: order.id })),
      { transaction: t }
    );

    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
    await t.commit();

    const full = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }] });
    res.status(201).json({ order: formatOrder(full) });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const where  = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const orders = await Order.findAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders: orders.map(formatOrder) });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ order: formatOrder(order) });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.update({ status: req.body.status });
    const full = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }] });
    res.json({ order: formatOrder(full) });
  } catch (err) {
    next(err);
  }
};
