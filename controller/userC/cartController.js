const cartModel=require("../../model/cartModel")
const productModel=require("../../model/productModel")
const couponModel=require("../../model/couponModel")
const cartHelper=require("../../helper/cartHelper")
const moment =require("moment")

const getcart = async (req, res,next) => {
    try {
        const userId = req.session.user._id;
        // console.log("im in getcart")
        let discountAmount
        let discountTotal
        const cartData = await cartHelper.getcart(userId);

        if( cartData && cartData.items > 0 ){
            
            req.session.productCount = cartData.items.length

             console.log( " req.session.productCount ",req.session.productCount )
            //  console.log("cartData",cartData)
        }
        let totalPrice =0
        if( cartData && cartData.coupon  ) {

            const coupon = await couponModel.findById(cartData.coupon)
            let discountAmount =0;
             totalPrice = cartData.totalPrice
            
            // console.log("totalPrice",totalPrice)

            if(!coupon){
                    discountAmount =0,
                    discountTotal = totalPrice
             }
            
            if(coupon.discountType === "percentage"){
                discountAmount = (coupon.discount/100)* totalPrice;

                // console.log("discountAmount : percentage",discountAmount)
            }
            else if(coupon.discountType==="fixed-amount"){
                discountAmount = coupon.discount
                console.log("discountAmount : fixed",discountAmount)
            }

            // console.log("totalPrice",totalPrice)
            const discountedTotal = totalPrice-discountAmount;
            
        }
        
        const availableCoupons = await couponModel.find({status:true,startingDate:{$lte:new Date()},expiryDate:{$gte:new Date()}})

        res.json(cartData,totalPrice,availableCoupons,discountAmount,discountTotal); // Ensure the response is JSON

    } catch (error) {
        console.error('Error removing product from cart:', error);
        error.status = 500; // Set the status code to 500
        next(error); // Pass the error to the next middleware (means : errorhandler.js in middleware folder)
    }
};

const addToCart = async (req, res,next) => {
    // console.log("I am in addtoCart Controller");
    try {
            const { productId} = req.body;
                       
            const productDetails = await productModel.findOne({ _id: productId })
            .populate("category");
            
            const stockQuantity = productDetails.stock;
            const regularPrice = productDetails.regularPrice;
            const oldPrice = productDetails.oldPrice;
            let discount = productDetails?.discount;
            let catOffer =productDetails.category?.offer;
            
            console.log(catOffer)
            if(!discount)
            {
                discount = 0
            }
            let discountApplied = discount;
            if(!catOffer)
            {
                catOffer = 0
            }
            console.log(catOffer)
            console.log(discount)
            isCategoryOfferApplied = false

            if (catOffer > discount)
            {
                 discountApplied = catOffer
                isCategoryOfferApplied = true
            }
            
            console.log("oldPrice" ,oldPrice)

            
            const discountPrice = oldPrice - (oldPrice * (discountApplied / 100));
            console.log("discountApplied",discountApplied)
            console.log("discountPrice -price in cart " ,discountPrice)

            let cart = await cartModel.findOne({ userId: req.session.user._id });
            if (!cart) {
                cart = new cartModel({ userId: req.session.user._id, items: [], totalPrice: 0 });
               }
            const cartItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            // console.log("cartItemIndex" ,cartItemIndex)

            if (stockQuantity > 0) {
                if (cartItemIndex > -1) {
                    // vv Updating existing item if index > -1 , there can be product in index 0
                    const existingItemCart = cart.items[cartItemIndex];
                    const availableQuantity = Math.min(stockQuantity, 5) - existingItemCart.quantity;

                    if (availableQuantity > 0) {
                       
                        const incrementQuantity = Math.min(availableQuantity, 1);
                        existingItemCart.quantity += incrementQuantity;
                        existingItemCart.price = discountPrice;

                        //new fields added for category offer 31/7/24
                        existingItemCart.discount = discountApplied;
                        existingItemCart.isCatOffer =isCategoryOfferApplied
                    } 
                    else {
                        // console.log("reached the maximum quantity of products available for purchase")
                        return res.status(404).json({
                            message: "You've reached the maximum quantity of products available for purchase.",
                            login: true,
                            newItem: false
                        });
                    }
                } 
                else {
                    cart.items.push({ productId: productId, price: discountPrice,  discount : discountApplied,isCatOffer: isCategoryOfferApplied,quantity: 1 });
                    // cart.items.push({ productId: productId, price: discountPrice, quantity: 1 });
                }

              console.log("cart",cart)
               const totalPriceCalculated= cartHelper.calculateTotalPricefromItems(cart.items) ?? discountPrice;
               if(totalPriceCalculated == 0 )
                {
                  totalPriceCalculated = discountPrice
                }
                cart.totalPrice  = totalPriceCalculated

                console.log("totalPrice",cart.totalPrice)


                await cart.save();

                req.session.productCount  = cart.items.length
                console.log("cart.save(),saved sucess")

                return res.status(200).json({ success: true,message :"Added to cart successfully", login: true, outOfStock:false, newItem: true, totalPrice: cart.totalPrice });
            } 
            else {
                 console.log("Product is out of stock")
                 error.status = 404; // Set the status code to 500
                 next(error); // Pass the error to the next middleware (means : errorhandler.js in middleware folder)
                // return res.status(404).json({ success: false,message: "Product is out of stock", login: true,outOfStock:true, newItem: false });
            }
    
    } catch (error) {
        // console.log("Error in add to cart:",error);
        console.error('Error removing product from cart:', error);
        error.status = 500; // Set the status code to 500
        next(error); // Pass the error to the next middleware (means : errorhandler.js in middleware folder)
    }
};

const viewcart = async (req, res,next) => {
    try {
            // console.log("I m in viewcart")
            // Find the cart for THE user LOGGED and populate cart ALL DETAILS
            const cartData = await cartModel.findOne({ userId: req.session.user._id }).populate('items.productId');
            let discountAmount = 0
            let discountedTotal =0

       
            // If cartData is null, declare & initialize  cart AS EMPTY //VV
            const cart = cartData ? {
                items: cartData.items.map(item => 
                    ({
                        productId: {
                            _id: item.productId._id,
                            productImage: item.productId.productImage || [], // Default to an  array:empty if undefined                        name: item.productId.name,
                            name: item.productId.productName,
                            stock: item.productId.stock,
                            description: item.productId.description
                           
                        },
                    price: item.price,
                    isCatOffer: item.isCatOffer,
                    discount: item.discount,
                    quantity: item.quantity
                    
                    
                })),
                coupon : cartData.coupon,
                totalPrice: cartData.totalPrice
            } : { items: [], coupon : null,totalPrice: 0 }; // coupon: cartData.coupon,

         
              if( cart && cart.items.length > 0 ){
                console.log(cart.items)
                req.session.productCount = cart.items.length
                
                }

                if( cart && cart.coupon  ) {
                    const coupon = await couponModel.findById(cart.coupon)
                    let discountAmount =0;
                    let totalPrice = cart.totalPrice
                    if(!coupon){
                        discountAmount =0,
                        discountedTotal = totalPrice
                    }
                    if(coupon.discountType === "percentage"){
                        discountAmount = (coupon.discount/100)* totalPrice;
                        if(discountAmount > coupon.maxDiscount )
                        {
                            discountAmount = coupon.maxDiscount //added on 6/7/24
                        }
                    }
                    else if(coupon.discountType==="fixed-amount"){
                        discountAmount = coupon.discount
                    }
            
                    const discountedTotal = totalPrice-discountAmount;
                }
                
                const availableCoupons = await couponModel.find({status:true,startingDate:{$lte:new Date()},expiryDate:{$gte:new Date()}})
                
                // Render the cart view and pass the cart data
            res.render("user/shop-cart", { cart:cart ,availableCoupons,discountAmount :discountAmount, discountedTotal: discountedTotal,moment,shortDateFormat: 'DD-MM-YYYY', // Pass the date format
                 });

        } 
        catch (error) {
            console.log("Error in cart management:", error);
            // res.status(500).send("Internal Server Error");

            error.status = 500; // Set the status code to 500
            next(error); // Pass the error to the next middleware (means : errorhandler.js in middleware folder)
        }
};

const deCart = async (req, res,next) => {
    try {

        // console.log("im in decart")
        const userId = req.session.user._id;
        const productId = req.body.productId; // Accessing productId sent via fetch
        const result = await cartHelper.removeProduct(userId, productId);

        req.session.productCount = (req.session.productCount ) ?  (req.session.productCount ||0) - 1 : 0
       res.json(result);
    } catch (error) {
        console.error('Error removing product from cart:', error);
        // res.status(500).json({ success: false, message: 'Internal Server Error' });
        error.status = 500; // Set the status code to 500
        next(error); // Pass the error to the next middleware (means : errorhandler.js in middleware folder)
    }
}

const updateQuantities = async (req, res,next) => {
    try {
        if (req.session.user && req.session.user._id) {
            const { productId, action } = req.body;

            const result = await cartHelper.updateQuantities(req.session.user._id, productId, action);

            if (result.success) {
                res.json(result);
            } else {
                res.json({ success: false, message: result.message, newQuantity: result.newQuantity });
            }
        } else {
            res.json({ success: false, message: 'User not logged in' });
        }
    } catch (error) {
        console.error('Error removing product from cart:', error);
        error.status = 500; // Set the status code to 500
        next(error); // Pass the error to the next middleware (means : errorhandler.js in middleware folder)
    }
};
 
module.exports={
    getcart,addToCart,
    viewcart ,updateQuantities  ,deCart 
  }

