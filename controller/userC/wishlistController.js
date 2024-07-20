// const wishlist = require('../../model/wishlistModel');
const wishlistModel=require('../../model/wishlistModel')
const productModel = require('../../model/productModel')

const viewWishlist = async (req, res) => {
    try {
        //  console.log( req.session.user._id )
        // if (req.session.user) {
            // getting the wishlist for the user and populating product details //vv
            const wishlistData = await wishlistModel.findOne({ userId: req.session.user._id }).populate('items.productId');

            //  console.log(wishlistData.items[0].productId.productName)
            // If wishlist is null, we need to initialize an empty wishlist
            const data = wishlistData ? {
                items: wishlistData.items.map(item => 
                    ({
                    productId: {
                        _id: item.productId._id,
                        productImage: item.productId.productImage || [], // Default to an empty array if undefined                        name: item.productId.name,
                        name: item.productId.productName,
                        description: item.productId.description,
                        regularPrice: item.productId.regularPrice ,
                        oldPrice: item.productId.oldPrice ,
                        stock : item.productId.stock > 0 ? "In Stock" : "Out of Stock"
                    },
                })),
            } : { items: []};

            req.session.wishlistCount  = data.items.length

           
            res.render("user/shop-wishlist", { wishlist:data });
        
    } catch (error) {
        // console.log("Error in cart management:", error);
        res.status(404).send("Internal Server Error" ,error);
    }
};

const addtowishlist = async (req, res) => {
    try {
        const productId = req.body.productId;
        const productDetails = await productModel.findOne({ _id: productId });
        const stockDetails = productDetails.stock > 0 ? "In Stock" : "Out Of Stock";

        const wishlistData = await wishlistModel.findOne({ userId: req.session.user._id });

        if (!wishlistData) {
            let wishlist = new wishlistModel({ userId: req.session.user._id, items: [{ productId: productId, stock: stockDetails }] });
            await wishlist.save();
            return res.status(200).json({ success: true, message: "Added to wishlist successfully", login: true, newItem: true });
        } else {
            // Check if the product is already in the wishlist
            const productIndex = wishlistData.items.findIndex(item => item.productId.toString() === productId);
            if (productIndex === -1) {
                wishlistData.items.push({ productId: productId, stock: stockDetails });
                await wishlistData.save();

                req.session.wishlistCount  = (req.session.wishlistCount || 0 ) + 1


                return res.status(200).json({ success: true, message: "Added to wishlist successfully", login: true, newItem: true });
            } else {
                return res.status(409).json({ success: true, message: "Already added to wishlist", login: true, newItem: false });
            }
        }
    } catch (error) {
        // console.log("Error in wishlist management:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", login: false });
    }
};


const removeWishlist = async (req, res) => {
    try {
        // console.log("i m in remove wishlist")
            const userId = req.session.user._id;
            const productId = req.body.productId; // Accessing productId sent via fetch
            // find by userid ..get the wishlist data..// 21/6/24 
            const wishlist = await wishlistModel.findOne({ userId });
        
            if (!wishlist) {
                return  res.status(404).json({ success: false, login:true,message: 'Wishlist not found' });
            }
            const productIndex = wishlist.items.findIndex(item => item.productId.toString() === productId);
            // console.log(productIndex)  //0th positions
        
            if (productIndex === -1) {
                return  res.status(404).json({ success: false, login:true,message: 'Product not found in wishlist' });
            }
            // vv - Remove the product from the wishlist
            wishlist.items.splice(productIndex, 1);
            await wishlist.save();
            // console.log("Saved wishlist items")
            
            return  res.status(200).json({ success: true, login:true,message: 'Product removed from wishlist' });
        } 
        catch (error) 
        {
            console.error('removeProduct : Error removing product from wishlist:', error);
            return  res.status(500).json({ success: false,login:true, message: 'An error occurred while removing the product from the wishlist' });

            // return { success: false, message: 'An error occurred while removing the product from the wishlist' };
        }
    } ;

module.exports = {viewWishlist,addtowishlist,removeWishlist}

