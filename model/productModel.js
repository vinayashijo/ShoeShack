const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  regularPrice: {
    type: Number,
    required: true,
  },
  oldPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  createdOn: {
    type: String,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  productImage: {
    type: Array,
    required: true,
  },
  stock: {
    type: Number,
    required:true,  
 
  },
});

const product = mongoose.model("product", productSchema);
module.exports = product;