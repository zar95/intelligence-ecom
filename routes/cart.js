const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Order = require('../models/Order');

// Use a fixed Guest ID for functionality testing (bypassing real auth)
const GUEST_ID = '507f1f77bcf86cd799439011';

// Internal helper to ensure the guest user exists in the DB
async function ensureGuest() {
  let user = await User.findById(GUEST_ID);
  if (!user) {
    user = await User.create({
      _id: GUEST_ID,
      name: 'Guest User',
      email: 'guest@example.com',
      password: 'password123',
      roles: ['customer']
    });
  }
  return user;
}

// Global middleware for this router to set req.user to Guest
router.use(async (req, res, next) => {
  try {
    await ensureGuest();
    req.user = { _id: GUEST_ID };
    next();
  } catch (err) {
    console.error('Error ensuring guest user:', err);
    res.status(500).send('Initialization Error');
  }
});

// View cart page
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: GUEST_ID }).populate('items.product');
    const items = cart ? cart.items.filter(it => it.product) : [];

    res.render('site/cart', {
      title: 'Your Cart — Lumina',
      cart,
      items
    });
  } catch (err) {
    console.error('CART GET ERROR:', err);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Get cart count
router.get('/count', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: GUEST_ID });
    const totalCount = cart ? cart.items.reduce((s, it) => s + it.quantity, 0) : 0;
    res.json({ cartCount: totalCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let cart = await Cart.findOne({ user: GUEST_ID });
    if (!cart) {
      cart = new Cart({ user: GUEST_ID, items: [] });
    }

    const idx = cart.items.findIndex(i => i.product.toString() === product._id.toString());
    if (idx !== -1) {
      cart.items[idx].quantity += qty;
      cart.items[idx].price = product.price;
    } else {
      cart.items.push({ product: product._id, quantity: qty, price: product.price });
    }

    await cart.save();
    const totalCount = cart.items.reduce((s, it) => s + it.quantity, 0);
    res.json({ success: true, cartCount: totalCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update quantity
router.post('/update-qty', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);

    const cart = await Cart.findOne({ user: GUEST_ID });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const idx = cart.items.findIndex(i => i.product.toString() === productId.toString());
    if (idx === -1) return res.status(404).json({ error: 'Item not in cart' });

    cart.items[idx].quantity = qty;
    await cart.save();

    const totalCount = cart.items.reduce((s, it) => s + it.quantity, 0);
    res.json({
      success: true,
      cartCount: totalCount,
      itemSubtotal: (cart.items[idx].price * qty).toFixed(2),
      cartTotal: cart.totalPrice.toFixed(2)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove item from cart
router.post('/remove', async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: GUEST_ID });
    if (!cart) return res.json({ success: true, cartCount: 0 });

    cart.items = cart.items.filter(i => i.product.toString() !== productId.toString());
    await cart.save();
    const totalCount = cart.items.reduce((s, it) => s + it.quantity, 0);
    res.json({ success: true, cartCount: totalCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear cart
router.post('/clear', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: GUEST_ID });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, cartCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Checkout
router.post('/checkout', async (req, res) => {
  try {
    const { shippingAddress, paid } = req.body;
    const cart = await Cart.findOne({ user: GUEST_ID }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${item.product.name}"` });
      }
    }

    const orderNumber = 'LM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const order = new Order({
      orderNumber,
      customer: GUEST_ID,
      items: cart.items.map(i => ({
        product: i.product._id,
        name: i.product.name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity
      })),
      shippingAddress: shippingAddress || {},
      totalAmount: cart.totalPrice,
      status: paid ? 'processing' : 'pending',
      paymentStatus: paid ? 'paid' : 'unpaid'
    });

    await order.save();

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    cart.items = [];
    await cart.save();

    res.json({ success: true, orderId: order._id, orderNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Wishlist Logic
router.post('/wishlist/toggle', async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(GUEST_ID);

    const already = user.wishlist.find(id => id.toString() === productId.toString());
    if (already) {
      await User.findByIdAndUpdate(GUEST_ID, { $pull: { wishlist: productId } });
    } else {
      await User.findByIdAndUpdate(GUEST_ID, { $addToSet: { wishlist: productId } });
    }

    const updated = await User.findById(GUEST_ID);
    res.json({ success: true, wishlistCount: updated.wishlist.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
