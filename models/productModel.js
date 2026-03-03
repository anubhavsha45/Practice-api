const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A product must have a name"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "A product must have a price"],
  },
  rating: {
    type: Number,
    required: [true, "A product must have a ratings"],
  },
  category: {
    type: String,
    required: [true, "A product must have a category"],
    trim: true,
  },
  stock: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
