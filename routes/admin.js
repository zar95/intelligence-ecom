var express = require('express');
var router = express.Router();
var Product = require('../models/Product');
var Category = require('../models/Category');

// Add middlewares to router for authentication and role authorization
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

router.use(requireAuth);
router.use(requireRole('admin'));

// ── List all products ────────────────────────────────────────────────────────
router.get('/products', async function (req, res) {
    try {
        const products = await Product.find({}).populate('category').sort({ createdAt: -1 });
        res.render('admin/products/list', {
            layout: 'admin/layout',
            title: 'Products — Admin',
            products: products,
            flash: req.query.flash || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// ── Dashboard (overview) ─────────────────────────────────────────────────────
router.get('/', async function (req, res) {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        var totalValue = products.reduce(function (sum, p) { return sum + p.price; }, 0);
        res.render('admin/dashboard', {
            layout: 'admin/layout',
            title: 'Admin Dashboard — Lumina',
            totalProducts: products.length,
            totalValue: totalValue,
            recentProducts: products.slice(0, 5), // Already sorted desc
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// ── Create form ───────────────────────────────────────────────────────────────
router.get('/products/create', async function (req, res) {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.render('admin/products/create', {
            layout: 'admin/layout',
            title: 'Create Product — Admin',
            product: null,
            categories: categories,
            errors: null,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/products?flash=Error+loading+form');
    }
});

// ── Store new product ─────────────────────────────────────────────────────────
router.post('/products/create', async function (req, res) {
    var body = req.body;
    if (!body.name || !body.brand || !body.price) {
        return res.render('admin/products/create', {
            layout: 'admin/layout',
            title: 'Create Product — Admin',
            product: body,
            errors: 'Name, brand, and price are required.',
        });
    }

    try {
        // Generate slug
        const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Handle metaKeywords
        let metaKeywords = [];
        if (body.metaKeywords && typeof body.metaKeywords === 'string') {
            metaKeywords = body.metaKeywords.split(',').map(k => k.trim()).filter(k => k);
        }

        // Generate metaDescription if empty
        let metaDescription = body.metaDescription || '';
        if (!metaDescription && body.description) {
            metaDescription = body.description.substring(0, 157) + '...';
        }

        const newProduct = new Product({
            name: body.name,
            slug: slug,
            brand: body.brand,
            price: parseFloat(body.price),
            compareAtPrice: body.was ? parseFloat(body.was) : undefined,
            discount: body.discount,
            icon: body.icon,
            badge: body.badge,
            badgeClass: body.badgeClass,
            category: body.category,
            description: body.description,
            metaKeywords: metaKeywords,
            metaDescription: metaDescription
        });

        await newProduct.save();
        res.redirect('/admin/products?flash=Product+created+successfully');
    } catch (err) {
        console.error(err);
        res.render('admin/products/create', {
            layout: 'admin/layout',
            title: 'Create Product — Admin',
            product: body,
            errors: 'Error saving product. Make sure name/slug is unique.',
        });
    }
});

// ── Edit form ─────────────────────────────────────────────────────────────────
router.get('/products/:id/edit', async function (req, res) {
    try {
        var product = await Product.findById(req.params.id);
        if (!product) return res.redirect('/admin/products?flash=Product+not+found');

        const categories = await Category.find({}).sort({ name: 1 });

        // Format metaKeywords for the form if needed (array to string)
        if (product.metaKeywords && Array.isArray(product.metaKeywords)) {
            product.metaKeywordsStr = product.metaKeywords.join(', ');
        }

        // Map old data format to new for the view if needed
        product.was = product.compareAtPrice;

        res.render('admin/products/edit', {
            layout: 'admin/layout',
            title: 'Edit Product — Admin',
            product: product,
            categories: categories,
            errors: null,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/products?flash=Error+fetching+product');
    }
});

// ── Update product ─────────────────────────────────────────────────────────────
router.post('/products/:id/edit', async function (req, res) {
    var body = req.body;
    if (!body.name || !body.brand || !body.price) {
        return res.render('admin/products/edit', {
            layout: 'admin/layout',
            title: 'Edit Product — Admin',
            product: { ...body, id: req.params.id },
            errors: 'Name, brand, and price are required.',
        });
    }

    try {
        let updateData = {
            name: body.name,
            brand: body.brand,
            price: parseFloat(body.price),
            compareAtPrice: body.was ? parseFloat(body.was) : undefined,
            discount: body.discount,
            icon: body.icon,
            badge: body.badge,
            badgeClass: body.badgeClass,
            category: body.category,
            description: body.description
        };

        // Update slug if name changes? Often better not to change slugs to avoid breaking links
        // We'll leave it as is for simplicity, or re-generate if needed.

        // Handle metaKeywords
        if (body.metaKeywords !== undefined) {
            updateData.metaKeywords = body.metaKeywords.split(',').map(k => k.trim()).filter(k => k);
        }

        if (body.metaDescription !== undefined) {
            updateData.metaDescription = body.metaDescription;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.redirect('/admin/products?flash=Product+updated+successfully');
    } catch (err) {
        console.error(err);
        res.render('admin/products/edit', {
            layout: 'admin/layout',
            title: 'Edit Product — Admin',
            product: { ...body, id: req.params.id },
            errors: 'Error updating product.',
        });
    }
});

// ── Delete product ─────────────────────────────────────────────────────────────
router.post('/products/:id/delete', async function (req, res) {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin/products?flash=Product+deleted');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/products?flash=Error+deleting+product');
    }
});

module.exports = router;
