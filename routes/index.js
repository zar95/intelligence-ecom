var express = require("express");
var router = express.Router();
var Product = require("../models/Product");
var Category = require("../models/Category");
var Order = require("../models/Order");

// Format products for EJS templates (adds $ prefix to prices)
function formatProducts(products) {
  return products.map(function (p) {
    // p might be a mongoose document, so convert to plain object
    const plainP = p.toObject ? p.toObject() : p;
    return Object.assign({}, plainP, {
      price: "$" + plainP.price.toFixed(2),
      was: plainP.compareAtPrice ? "$" + plainP.compareAtPrice.toFixed(2) : (plainP.was ? "$" + parseFloat(plainP.was).toFixed(2) : ""),
      mainImageUrl: (plainP.images && plainP.images.length > 0) ? plainP.images[0] : null
    });
  });
}

var orders = [
  { id: "#LM-00891", product: "Ultra-Bass Headphones Pro", date: "Mar 3, 2024", amount: "$129", status: "Delivered", color: "var(--primary)" },
  { id: "#LM-00876", product: "Chrono Series Watch", date: "Feb 28, 2024", amount: "$194", status: "Shipped", color: "var(--accent)" },
  { id: "#LM-00865", product: "Vision X VR Headset", date: "Feb 22, 2024", amount: "$449", status: "Processing", color: "var(--warning)" },
  { id: "#LM-00843", product: "Pad Air Creative Edition", date: "Feb 15, 2024", amount: "$349", status: "Delivered", color: "var(--primary)" },
  { id: "#LM-00831", product: "SoundBar X700 Dolby", date: "Feb 9, 2024", amount: "$299", status: "Delivered", color: "var(--primary)" }
];

// Home page
router.get("/", async function (req, res) {
  try {
    const flashProducts = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(4);

    res.render("index", {
      title: "Lumina — Premium Tech Deals",
      flashProducts: formatProducts(flashProducts)
    });
  } catch (err) {
    console.error(err);
    res.render("index", { title: "Lumina — Premium Tech Deals", flashProducts: [] });
  }
});

// Shop collection & Search
router.get("/shop", async function (req, res) {
  try {
    const query = { isActive: true };
    const sortObj = {};

    // Pagination logic
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Check if there is a search query
    if (req.query.q) {
      query.$text = { $search: req.query.q };
      sortObj.score = { $meta: "textScore" };
    } else {
      // Default sort
      sortObj.createdAt = -1;
    }

    // Add sorting based on query param if no text search
    if (!req.query.q && req.query.sort === 'price_asc') {
      sortObj.price = 1;
    } else if (!req.query.q && req.query.sort === 'price_desc') {
      sortObj.price = -1;
    }

    // Category filtering
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        query.category = category._id;
      }
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    let productsQuery = Product.find(query);

    if (req.query.q) {
      productsQuery = productsQuery.select({ score: { $meta: "textScore" } }).sort(sortObj);
    } else {
      productsQuery = productsQuery.sort(sortObj);
    }

    productsQuery = productsQuery.skip(skip).limit(limit);

    const products = await productsQuery;

    // Fetch categories with counts for the sidebar
    const categories = await Category.find();
    const categoriesWithCounts = await Promise.all(categories.map(async (cat) => {
      const count = await Product.countDocuments({ category: cat._id, isActive: true });
      return { ...cat.toObject(), count };
    }));

    res.render("site/shop", {
      title: "Shop Collection — Lumina",
      products: formatProducts(products),
      categories: categoriesWithCounts,
      searchQuery: req.query.q || "",
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
      limit: limit,
      currentCategory: req.query.category || ""
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Special deals
router.get("/deals", async function (req, res) {
  try {
    const query = { compareAtPrice: { $exists: true, $ne: null }, isActive: true };

    // Category filtering for deals
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        query.category = category._id;
      }
    }

    const dealProducts = await Product.find(query)
      .sort({ 'ratings.average': -1 })
      .limit(10);

    const categories = await Category.find();

    res.render("site/deals", {
      title: "Special Deals — Lumina",
      deals: formatProducts(dealProducts),
      categories: categories,
      currentCategory: req.query.category || ""
    });
  } catch (err) {
    console.error(err);
    res.render("site/deals", { title: "Special Deals — Lumina", deals: [], currentCategory: "" });
  }
});

// Product detail
router.get("/product/:slug?", async function (req, res) {
  try {
    let product;

    // Fallback logic because the original URLs used custom IDs instead of real slugs
    // If it looks like a mongo id, use findById, else use slug
    const param = req.params.slug;
    if (param && param.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(param);
    } else if (param) {
      product = await Product.findOne({ slug: param, isActive: true });
    }

    // If no product found, render a generic one or redirect
    if (!product) {
      return res.status(404).render("error", {
        message: "Product not found",
        error: { status: 404 }
      });
    }

    // Dynamic related products
    let dbRelatedProducts = [];
    if (product.category) {
      dbRelatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: true
      }).limit(4);
    }

    // Fallback to general database products if less than 4 found in same category
    let finalRelated = formatProducts(dbRelatedProducts);
    if (finalRelated.length < 4) {
      const needed = 4 - finalRelated.length;
      const fallbackProducts = await Product.find({
        _id: { $ne: product._id, $nin: dbRelatedProducts.map(p => p._id) },
        isActive: true
      }).limit(needed);
      finalRelated = [...finalRelated, ...formatProducts(fallbackProducts)];
    }

    res.render("site/product", {
      title: `${product.name} — Lumina`,
      product: product,
      metaKeywords: product.metaKeywords ? product.metaKeywords.join(", ") : "",
      metaDescription: product.metaDescription || product.description || "",
      related: finalRelated
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Client dashboard
router.get("/dashboard", async function (req, res) {
  try {
    const GUEST_ID = '507f1f77bcf86cd799439011';
    const User = require("../models/User");

    // Ensure guest exists
    let user = await User.findById(GUEST_ID);
    if (!user) {
      await User.create({
        _id: GUEST_ID,
        name: 'Guest User',
        email: 'guest@example.com',
        password: 'password123',
        roles: ['customer']
      });
    }

    // Fetch real orders for guest
    const dbOrders = await Order.find({ customer: GUEST_ID }).sort({ createdAt: -1 }).limit(10).populate('items.product');

    const finalOrders = dbOrders.map(o => ({
      id: `#LM-${o._id.toString().substring(18).toUpperCase()}`,
      product: o.items.length > 0 && o.items[0].product ? o.items[0].product.name : "Check Order Details",
      date: o.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: "$" + o.totalAmount,
      status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
      color: o.status === 'delivered' ? 'var(--primary)' :
        o.status === 'pending' ? 'var(--warning)' :
          o.status === 'shipped' ? 'var(--accent)' : 'var(--text-muted)'
    }));

    // Fetch real wishlist
    user = await User.findById(GUEST_ID).populate('wishlist');
    const finalWishlist = (user && user.wishlist ? user.wishlist : []).map(p => ({
      icon: p.icon || "📦",
      name: p.name,
      price: "$" + p.price,
      slug: p.slug
    }));

    res.render("site/dashboard", {
      title: "My Dashboard — Lumina",
      orders: finalOrders,
      wishlist: finalWishlist
    });
  } catch (err) {
    console.error(err);
    res.render("site/dashboard", { title: "My Dashboard — Lumina", orders: [], wishlist: [] });
  }
});

// ── Auth pages ───────────────────────────────────────────────────────────────
router.get("/login", function (req, res) {
  res.render("site/login", { layout: false, error: null });
});
router.post("/login", function (req, res) {
  // TODO: real auth — for now simulate success
  res.cookie("role", "client", { httpOnly: false });
  res.redirect("/dashboard");
});

router.get("/register", function (req, res) {
  res.render("site/register", { layout: false, error: null });
});
router.post("/register", function (req, res) {
  // TODO: real auth — for now simulate success
  res.cookie("role", "client", { httpOnly: false });
  res.redirect("/dashboard");
});

// ── Placeholder routes ────────────────────────────────────────────────────────

module.exports = router;
