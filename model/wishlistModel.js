const mongoose = require("mongoose")

const wishlistSchema = mongoose.Schema({
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

    stock : {type:String, 
      default: "In Stock"}, 

    wishlistDate:{
        type:Date,
        default: Date.now
      }    
    }
    
    ],
 
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const wishlist = mongoose.model("wishlist", wishlistSchema);
module.exports = wishlist;