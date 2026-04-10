const mongoose = require('mongoose');
const config = require('config');

module.exports = function() {
  const db = process.env.MONGODB_URI || config.get('db') || 'mongodb://localhost/lumina';
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
    .then(() => console.log(`Connected to MongoDB: ${db}...`))
    .catch(err => console.error('Could not connect to MongoDB...', err));
}
