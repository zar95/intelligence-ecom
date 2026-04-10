const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  brand: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: Number, // The "was" price
  discount: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false }, // optional for now for simple seeding
  icon: String,
  images: [String],
  badge: String,
  badgeClass: String,
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },

  // SEO Fields
  metaKeywords: [String],
  metaDescription: { type: String, maxlength: 160 },

  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ metaKeywords: 1 });
productSchema.index({ name: 'text', metaKeywords: 'text', metaDescription: 'text' });

module.exports = mongoose.model('Product', productSchema);
