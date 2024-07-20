const cartModel = require("../model/cartModel");
const productModel = require("../model/productModel");


const getcart = async (userId) => {
    try {
        const cartData = await cartModel.findOne({ userId }).populate('items.productId');

         // If cartData is null, initialize an empty cart
         const cart = cartData ? {
            items: cartData.items.map(item => 
                ({
                productId: {
                    _id: item.productId._id,
                    productImage: item.productId.productImage || [], // Default to an empty array if undefined                        name: item.productId.name,
                    name: item.productId.productName,
                    stock: item.productId.stock,  //added vv extra 25/6/
                    description: item.productId.description
                },
                price: item.price,
                quantity: item.quantity
            })),
            totalPrice: cartData.totalPrice,
            coupon : cartData.coupon
         } : { items: [], totalPrice: 0 };

        // console.log(cartData)

        if (!cartData) {
            return { success: false, message: 'Cart not found' };
        }

        return { success: true, items: cart.items, totalPrice: cart.totalPrice };
    } catch (error) {
        console.error('Error fetching cart:', error);
        return { success: false, message: 'An error occurred while fetching the cart.' };
    }
};

const calculateTotalPricefromItems = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

const calculateTotalPrice = async (userId) => {
    try {
        const cartItems = await cartModel.findOne({ userId }).populate("items.productId");
        if (cartItems) {
            const totalPrice = calculateTotalPricefromItems(cartItems.items);
            return parseFloat(totalPrice);
        }
        return 0;
    } catch (error) {
        // console.error("Error calculating total price:", error);
        throw error;
    }
};

const updateQuantities = async (userId, productId, action) => {
    try {
        // Fetch the user's cart and populate the items' product details
        const cart = await cartModel.findOne({ userId }).populate("items.productId");
        if (!cart) {
            return { success: false, message: 'Cart not found' };
        }

        // Find the index of the item in the cart
        const itemIndex = cart.items.findIndex(item => item.productId._id.toString() === productId);
        if (itemIndex === -1) {
            return { success: false, message: 'Item not found in cart' };
        }
        console.log("Cart - itemIndex:", itemIndex);

        // Extract the item and product details
        const item = cart.items[itemIndex];
        const product = await productModel.findById(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        // Calculate the new quantity
        const newQuantity = item.quantity + action;
        console.log("Current quantity:", item.quantity, "New quantity:", newQuantity, "Product stock:", product.stock);

        // Validate the new quantity
        if (newQuantity > 5) {
            return { success: false, message: 'Quantity cannot exceed 5', newQuantity: item.quantity };
        }

        // Update quantity and price if within valid range
        if (newQuantity > 0 && newQuantity <= product.stock) {
            item.quantity = newQuantity;
            console.log(item.quantity)

            item.price = (product.regularPrice - (product.regularPrice * (product.discount / 100))).toFixed(2);
            cart.totalPrice = calculateTotalPricefromItems(cart.items);

            await cart.save();
            console.log("Updated cart saved. Total price:", cart.totalPrice);

            return { success: true, message: 'Quantity updated successfully', newQuantity: item.quantity };
        } else if (newQuantity <= 0) {
            // Remove item if quantity falls to 0 or less
            cart.items.splice(itemIndex, 1);
            cart.totalPrice = calculateTotalPricefromItems(cart.items);
            await cart.save();

            return { success: true, message: 'Item removed from cart', newQuantity: 0 };
        } else {
            return { success: false, message: 'Insufficient stock', newQuantity: item.quantity };
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        return { success: false, message: 'An error occurred while updating the quantity.', newQuantity: item.quantity };
    }
};

const removeProduct = async (userId, productId) => {
    try {
        console.log("removeProduct - userId, productId" ,userId, productId )
        // find by userid - getting the cart data... vv
        const cart = await cartModel.findOne({ userId });

        if (!cart) {
            return { success: false,    message: 'Cart not found' };
        }

        const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        // console.log(productIndex)  //0th positions

        if (productIndex === -1) {
            return { success: false, message: 'Product not found in cart' };
        }

        // vv - Remove the product from the cart
        cart.items.splice(productIndex, 1);
        cart.totalPrice = calculateTotalPricefromItems(cart.items);

        
        await cart.save();
        console.log("saved balance cart items")

        return { success: true, message: 'Product removed from cart' };
    } catch (error) {
        console.error('removeProduct : Error removing product from cart:', error);
        return { success: false, message: 'An error occurred while removing the product from the cart' };
    }
};

// const totalCartPrice  = async (userId)=>{
//     try{
//         const totalPrice = await cartModel.aggregate([
//             // Matching the cart for a specific user
//         { $match: { userId: mongoose.Types.ObjectId.createFromHexString(user) } },
//         // Unwinding the items array
//         { $unwind: "$items" },
//         // Looking up product information for each item using lookup
//         {
//             $lookup: {
//                 from: "products",
//                 localField: "items.productId",
//                 foreignField: "_id",
//                 as: "product"
//             }
//         },
//         // Unwinding the product array
//         { $unwind: "$product" },
//         // Calculating the total price per item
//         {
//             $addFields: {
//                 totalPricePerItem: {
//                     $multiply: [
//                         "$product.regularPrice", "$items.quantity"]
//                 }
//             }
//         },
//         // Grouping the items to calculate total price for the cart
//         {
//             $group: {
//                 _id: "$_id",
//                 userId: { $first: "$userId" },
//                 items: {
//                     $push: {
//                         _id: "$items._id",
//                         productId: "$items.productId",
//                         productName: "$product.productName",
//                         quantity: "$items.quantity",
//                         totalPrice: "$totalPricePerItem"
//                     }
//                 },
//                 total: { $sum: "$totalPricePerItem" }
//             }
//         }
//         ]);
//         return totalPrice;
//     }catch(error){
//         console.log(error);
//     }
// };


module.exports = { getcart,
    calculateTotalPricefromItems,
    calculateTotalPrice,
    updateQuantities,removeProduct
};
