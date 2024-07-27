const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    offer: {
        type: Number,
        required: false,
        default: 0
      },
    islisted: {
        type: Boolean,
        required: true
    }
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
