const mongoose = require("mongoose")

const cartSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        default: 0,
      },  
      cartDate:{
        type:Date,
        default: Date.now,
      }    
    }
  ],
  totalPrice: {
    type: Number,
    default: 0,
  }, 
  coupon:{
    type : mongoose.Schema.Types.ObjectId,
    required : false
} ,
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;