const mongoose = require('mongoose');
const config = require('config');
const Product = require('./models/Product');
const Category = require('./models/Category');
const store = require('./data/products');

const db = process.env.MONGODB_URI || config.get('db') || 'mongodb://localhost/lumina';

mongoose.connect(db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
  .then(async () => {
    console.log(`Connected to MongoDB: ${db}...`);
    await seedDB();
  })
  .catch(err => {
    console.error('Could not connect to MongoDB...', err);
    process.exit(1);
  });

async function seedDB() {
  try {
    // Check if products already exist
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log('Database already seeded with products. Clearing first...');
      await Product.deleteMany({});
    }

    // Check and clear categories
    const catCount = await Category.countDocuments();
    if (catCount > 0) {
      console.log('Clearing categories first...');
      await Category.deleteMany({});
    }

    // Create categories
    const categoriesData = [
      { name: 'Audio', slug: 'audio', description: 'Headphones, speakers and more.' },
      { name: 'Wearables', slug: 'wearables', description: 'Smartwatches and fitness trackers.' },
      { name: 'Accessories', slug: 'accessories', description: 'Cables, cases, chargers and more.' },
      { name: 'Tablets', slug: 'tablets', description: 'iPads, Android tablets and e-readers.' },
      { name: 'VR', slug: 'vr', description: 'Virtual reality headsets and accessories.' },
      { name: 'Phones', slug: 'phones', description: 'Modern smartphones and devices.' },
      { name: 'Cinema', slug: 'cinema', description: 'Home theater and cinema experiences.' },
      { name: 'Cameras', slug: 'cameras', description: 'Digital cameras and lenses.' },
      { name: 'Drones', slug: 'drones', description: 'Aerial photography and racing drones.' },
      { name: 'Displays', slug: 'displays', description: 'Smart displays and monitors.' }
    ];

    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`Successfully seeded ${createdCategories.length} categories!`);

    // Helper to get category id by name
    const getCategoryIdByName = (name) => {
      const category = createdCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (category) return category._id;
      // Fallback to Accessories if not found
      const fallback = createdCategories.find(c => c.name === 'Accessories');
      return fallback ? fallback._id : createdCategories[0]._id;
    };

    const products = store.getAll();
    const productsToInsert = products.map(p => {
      // Create slug from id or name
      const slug = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      return {
        name: p.name,
        slug: slug,
        brand: p.brand,
        price: p.price,
        compareAtPrice: p.was,
        discount: p.discount,
        icon: p.icon,
        images: p.image ? [p.image] : [],
        badge: p.badge,
        badgeClass: p.badgeClass,
        category: getCategoryIdByName(p.category || 'Accessories'),
        stock: 50, // Default stock
        isActive: true,
        metaKeywords: [p.brand.toLowerCase(), p.name.toLowerCase(), 'tech', 'electronics'],
        metaDescription: `Buy ${p.name} by ${p.brand}. Best price ${p.price}.`
      };
    });

    await Product.insertMany(productsToInsert);
    console.log(`Successfully seeded ${productsToInsert.length} products!`);

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}
