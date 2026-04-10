const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Order = require('../../models/Order');
const Cart = require('../../models/Cart');

const GUEST_ID = '507f1f77bcf86cd799439011';

router.post('/', async (req, res) => {
  try {
    const { message: userMessage, history = [], lastProducts = [] } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return res.status(200).json({
        reply: "To enable my AI capabilities, please add a valid Groq API key to the .env file.",
        suggestions: ["How to add API key?", "Browse Shop", "View Deals"],
        products: []
      });
    }

    const groq = new Groq({ apiKey });

    // 1. Get grounding data from DB
    const [categories, brands, cart] = await Promise.all([
      Category.find({}).select('name slug'),
      Product.distinct('brand', { isActive: true }),
      Cart.findOne({ user: GUEST_ID }).populate('items.product')
    ]);
    const categoryNames = categories.map(c => c.name);
    const brandList = brands.join(', ');
    const cartItems = cart ? cart.items.map(it => it.product ? `${it.product.name} (Qty: ${it.quantity}, Price: $${it.price})` : 'Unknown').join(', ') : 'Empty';

    const lastProductsContext = lastProducts.length > 0
      ? lastProducts.map((p, i) => `${i+1}. "${p.name}" (ID: ${p.id}, Price: $${p.price})`).join('\n  ')
      : 'None';

    // 2. Build the reasoning prompt with history
    const systemPrompt = `You are "Lumina AI", a smart shopping assistant for Lumina E-Commerce.

GROUNDING:
- Current Categories: ${categoryNames.join(', ')}
- Available Brands: ${brandList}
- Current Cart: ${cartItems}
- Last Shown Products (with IDs — use these for add/remove if the user says "that one", "the first one", etc):
  ${lastProductsContext}

RULES:
- Help users find products and manage their shopping cart.
- You can add or remove products from the cart upon user request.
- If the user says "add this" or "remove this", refer to the previous product explicitly mentioned or shown in the history.
- Ask clarifying questions when the request is vague.
- ALWAYS remember the previous context of the conversation.
- STRICT: Do NOT guess or hallucinate product prices. If discussing prices, ONLY quote the precise prices provided in the Grounding Context. If you do not have the price, do not make one up.

OUTPUT INSTRUCTIONS (CRITICAL):
- You MUST output ONLY a raw JSON object. Nothing else.
- NO markdown code fences.
- NO introductory text.

JSON SCHEMA:
{
  "reply": "Your friendly conversational response",
  "searchQuery": {
    "text": "keyword to search for (or null)",
    "category": "exact category name (or null)",
    "minPrice": null,
    "maxPrice": null,
    "brand": "brand name (or null)"
  },
  "intent": {
    "action": "ADD_TO_CART" | "REMOVE_FROM_CART" | "CLEAR_CART" | "VIEW_CART" | "CHECKOUT" | null,
    "productId": "exact MongoDB _id from Last Shown Products list above, if identifiable (or null)",
    "productName": "the name of the product to add/remove if applicable (or null)"
  },
  "suggestions": ["up to 3 short follow-up options"]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.message })), // Keep last 6 messages
      { role: 'user', content: userMessage }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');
    let { reply, searchQuery, suggestions, intent } = aiResponse;

    // Resolve Intent into specific Product IDs if possible
    let resolvedProductId = null;
    if (intent && (intent.action === 'ADD_TO_CART' || intent.action === 'REMOVE_FROM_CART')) {
      // Try the AI-provided ID first (from Last Shown Products context)
      if (intent.productId) {
        try {
          const p = await Product.findById(intent.productId).select('_id');
          if (p) resolvedProductId = p._id;
        } catch (_) { /* invalid ObjectId — ignore */ }
      }
      
      // Ensure precise resolution for REMOVE_FROM_CART by searching within current cart items first
      if (!resolvedProductId && intent.action === 'REMOVE_FROM_CART' && intent.productName && cart) {
         const matchingItem = cart.items.find(it => 
             it.product && it.product.name.toLowerCase().includes(intent.productName.toLowerCase())
         );
         if (matchingItem) resolvedProductId = matchingItem.product._id;
      }

      // Fall back to general catalog name-based search (for ADD_TO_CART, or failover)
      if (!resolvedProductId && intent.productName) {
        const p = await Product.findOne({
          name: { $regex: new RegExp(intent.productName, 'i') },
          isActive: true
        }).select('_id');
        if (p) resolvedProductId = p._id;
      }
    }

    // Defensive: Sanitize AI hallucinations (strip raw URLs from UI text)
    const urlPattern = /https?:\/\/[^\s]+/g;
    if (reply) reply = reply.replace(urlPattern, '').trim();
    if (searchQuery && searchQuery.text && urlPattern.test(searchQuery.text)) {
      searchQuery.text = null;
    }
    if (suggestions) {
      suggestions = suggestions.map(s => s.replace(urlPattern, '').trim()).filter(Boolean);
    }

    // 3. Execute DB Search based on AI reasoning
    let products = [];
    if (searchQuery && (searchQuery.text || searchQuery.category || searchQuery.brand || searchQuery.maxPrice)) {
      const dbQuery = { isActive: true };

      if (searchQuery.text) {
        dbQuery.$text = { $search: searchQuery.text };
      }

      if (searchQuery.category) {
        const cat = categories.find(c => c.name.toLowerCase() === searchQuery.category.toLowerCase());
        if (cat) dbQuery.category = cat._id;
      }

      if (searchQuery.brand) {
        dbQuery.brand = { $regex: new RegExp(searchQuery.brand, 'i') };
      }

      if (searchQuery.minPrice || searchQuery.maxPrice) {
        dbQuery.price = {};
        if (searchQuery.minPrice) dbQuery.price.$gte = searchQuery.minPrice;
        if (searchQuery.maxPrice) dbQuery.price.$lte = searchQuery.maxPrice;
      }

      let pQuery = Product.find(dbQuery);
      if (searchQuery.text) {
        pQuery = pQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
      } else {
        pQuery = pQuery.sort({ createdAt: -1 });
      }

      products = await pQuery.limit(4).lean();

      // Fallback: If no products found with strict query, try a broader regex search on name
      if (products.length === 0 && searchQuery.text) {
        const fallbackQuery = {
          isActive: true,
          name: { $regex: new RegExp(searchQuery.text, 'i') }
        };
        if (dbQuery.category) fallbackQuery.category = dbQuery.category;
        products = await Product.find(fallbackQuery).limit(4).lean();
      }
    }

    // 4. Final Response
    res.json({
      reply: reply || "I found some products you might like!",
      suggestions: suggestions || ["Search Headphones", "Gaming Gear", "Best Deals"],
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        image: (p.images && p.images.length > 0) ? p.images[0] : null,
        brand: p.brand
      })),
      intent: intent ? {
        action: intent.action,
        productId: resolvedProductId,
        productName: intent.productName
      } : null
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    if (error.status === 401) {
      return res.status(200).json({
        reply: "My AI connection seems to be using an invalid key. Please update the GROQ_API_KEY in the .env file.",
        suggestions: ["Go to Shop", "Contact Support"],
        products: []
      });
    }
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
});

// GET /api/chat/recommendations/:productId
// Returns up to 4 products from the same category (or same brand as fallback).
// No AI call—pure DB query for speed.
router.get('/recommendations/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .select('category brand name').lean();
    if (!product) return res.json({ recommendations: [] });

    const query = { isActive: true, _id: { $ne: product._id } };
    if (product.category) {
      query.category = product.category;
    } else if (product.brand) {
      query.brand = { $regex: new RegExp(product.brand, 'i') };
    }

    const recs = await Product.find(query).limit(4).lean();
    res.json({
      recommendations: recs.map(p => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        image: (p.images && p.images.length > 0) ? p.images[0] : null,
        brand: p.brand
      }))
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.json({ recommendations: [] });
  }
});

module.exports = router;