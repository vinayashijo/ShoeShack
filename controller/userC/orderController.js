const cartModel = require("../../model/cartModel");
const couponModel = require("../../model/couponModel");

const userModel = require("../../model/userModel");
const cartHelper = require("../../helper/cartHelper");
const paymentHelper = require("../../helper/paymentHelper"); //24/6/24
const orderModel = require("../../model/orderModel"); 
const productModel = require("../../model/productModel"); 
const product = require("../../model/productModel");
const paginationHelper = require("../../helper/paginationHelper"); //24/6/24
const moment = require("moment");
const couponHelper = require("../../helper/couponHelper");


const getCheckout = async (req, res) => {
    try {
        const userId = req.session.user?._id;
        if (userId) {
            const cartData = await cartHelper.getcart(userId);
            const user = await userModel.findOne({ _id: userId });
            const addresses = user.address;
            // console.log("wallet" ,user.wallet)
          
            res.render("user/shop-checkout", {
                address: addresses,
                data: cartData.items,
                totalPrice: cartData.totalPrice,
                walletBalance: user.wallet
            });
        } else {
            res.redirect("/userlogin");
        }
    } catch (error) {
        console.log("Error in getcheckout/order management:", error);
        res.status(500).send("Internal Server Error");
    }
};

const placeOrder = async (req, res) => {
    try {
        console.log("i m in place order")
        const { addressId, paymentMethod, walletAmount } = req.body;
        const userId = req.session.user._id;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const address = user.address.find(addr => addr._id.toString() === addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const cart = await cartModel.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        // console.log("price[0]" , cart.items[0].price)

        let totalAmount = 0;
        for (let cartItem of cart.items) {
            const product = cartItem.productId;
            if (!product || product.stock < cartItem.quantity) {
                return res.status(400).send(`Not enough stock for item: ${product ? product.name : cartItem.productId}`);
            }
            totalAmount += cartItem.price * cartItem.quantity;
            // console.log("totalAmount",totalAmount)
        }

         //discountAmount //coupons
         let discountAmount=0
        let discounted= {};
        if( cart && cart.coupon && totalAmount > 0 ) {
            discounted = await couponHelper.discountPrice( cart.coupon, totalAmount )
            console.log(discounted)

            await couponModel.updateOne({ _id : cart.coupon},{
                $push : {
                    users : user
                }
            })
            console.log("couponModel users added")
        }   
        console.log(discounted)  //{discountAmount,discountedTotal ->(totalamt-discount )}
        if(discounted.discountAmount>0){
            discountAmount=discounted.discountAmount
        }

        const totalPrice = discounted && discounted.discountedTotal ? discounted.discountedTotal : totalAmount

        let walletBalance = user.wallet || 0;
        let amountPayable = totalAmount;
        let walletUsed = 0;
        // console.log("walletAmount,walletUsed,amountPayable",walletAmount,walletUsed,amountPayable)


        if (walletAmount>0 && walletBalance > 0) {
            //if (walletBalance >= totalAmount) {
                if (walletBalance >= totalPrice) {
                console.log("I m in walletBalance >= totalPrice with discounted it")
                // walletUsed = totalAmount;
                walletUsed =totalPrice;
                amountPayable = 0;
                console.log("Wallet used is : totalPrice",walletUsed)
            } 
            else {     
                console.log("I m in walletBalance < totalPrice")
           
                walletUsed = walletBalance;
                // amountPayable = totalAmount - walletBalance;
                amountPayable = totalPrice - walletBalance;
                // console.log("amountPayable : totalAmount - walletBalance",amountPayable)

            }
            console.log(walletAmount,walletUsed,amountPayable)
        }
      
        const generatedID = Math.floor(10000 + Math.random() * 900000);
        let existingOrder = await orderModel.findOne({ orderId: generatedID });

        while (existingOrder) {
            generatedID = Math.floor(100000 + Math.random() * 900000);
            existingOrder = await orderModel.findOne({ orderId: generatedID });
        }

        const orderId = `ORD${generatedID}`;
        let orderStatus = paymentMethod === 'COD' ? 'Confirmed' : 'Pending';
        
        // console.log(paymentMethod)

        if (amountPayable === 0 || paymentMethod === 'Razorpay') {
            orderStatus = 'Confirmed';
        }

        const order = new orderModel({
            userId,
            items: cart.items.map(item => ({
                product: item.productId._id,
                price: item.price,
                quantity: item.quantity,
            })),         
            billingdetails: {
                name: address.name,
                mobile: address.mobile,
                pincode: address.pincode,
                houseName: address.houseName,
                cityOrTown: address.cityOrTown,
                district: address.district,
                state: address.state,
                country: address.country,
            },
            totalAmount : totalAmount,
            totalprice: totalPrice,
            walletUsed : walletUsed,
            amountPayable : amountPayable,
            paymentMethod : paymentMethod,
            orderStatus: orderStatus,
            paymentStatus: (paymentMethod === 'COD' ) ? 'Pending' : "Success" ,
            paymentReference : "TEST",
            discountAmount : discountAmount,
        });

        const ordered = await order.save();
        console.log("Order palced")

        //update product quantity from cart data...
        for( const items of cart.items ){
            const { productId, quantity } = items
            // console.log(productId,quantity);

            await productModel.updateOne({_id : productId},
                { $inc : { stock :  -quantity  }})
         } 
        
        //delete cart after order success...
        await cartModel.deleteOne({ userId : userId })

        req.session.productCount = 0
        
        //COD or amountto pay from razor pay is zero then..
        if (paymentMethod === 'COD' || amountPayable === 0 ) 
        {
            // console.log("COD || amountPayable === 0")
            if( walletAmount ) 
            {
                    await userModel.updateOne({ _id : user }, 
                    {
                            $inc : {
                                wallet : -walletUsed
                            },
                            $push : {
                                walletHistory : {
                                    date : Date.now(),
                                    amount : -walletUsed,
                                    message : 'Used for purchase'
                                }
                            }
                    })
                    console.log("updated wallet amount",walletUsed) 

                    let  payment  = "WalletRazorPay"
              
                return res.json({ payment :  payment , success : true})
            }
            else
            {
                console.log("COD") 
                return res.json({ payment :  "COD" , success : true})

            }
        }
        else if (paymentMethod === 'Razorpay' )
        {   
            await userModel.updateOne({ _id : user }, 
            {
                    $inc : {
                        wallet : -walletUsed
                    },
                    $push : {
                        walletHistory : {
                            date : Date.now(),
                            amount : -walletUsed,
                            message : 'Used for purchase'
                        }
                    }
            })

            const razorpayOrder = await paymentHelper.createRazorpayOrder(ordered._id, amountPayable);
            return res.json({ payment : razorpayOrder , success : true  })
        }
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while placing the order' });
    }
};

//razorpay confirm page
const getConfirmOrder = async (req, res,next) => {
    try {
        console.log("I m in getConfirmOrder ")
        const { user } = req.session;
        const { status } = req.params;
        console.log("STATUS",status )

        const lastOrder = await orderModel.findOne({ userId: user._id })
            .sort({ orderDate: -1 })
            .populate('items.product')
        
        if (lastOrder) {
            if(status== 0)
            {
                console.log("paymentStatus==Failed")
                await orderModel.updateOne(
                    { _id: lastOrder._id },
                    { $set: { orderStatus: 'Confirmed', paymentStatus: 'Failed' } }
                );
                console.log("lastOrder.orderStatus === 'Pending && paymentStatus === 'failed ,make both status as Failed");
                lastOrder.orderStatus = 'Confirmed';
                lastOrder.paymentStatus = 'Failed';
            }
            else //status=1
            {

                await orderModel.updateOne(
                    { _id: lastOrder._id },
                    { $set: { orderStatus: 'Confirmed', paymentStatus: 'Success' } }
                );

                // console.log("lastOrderorderStatus = Confirmed ,lastOrder.paymentStatus = Failed" )

                lastOrder.orderStatus = 'Confirmed';
                lastOrder.paymentStatus = 'Success';
                
            }

            // if (lastOrder.orderStatus === 'Pending') {
            //     console.log("lastOrder.orderStatus === 'Pending'");
            //     if (lastOrder.paymentStatus === 'Success') {
            //         console.log("lastOrder.orderStatus === 'Pending && paymentStatus === 'Success'");
                    
            //         await orderModel.updateOne(
            //             { _id: lastOrder._id },
            //             { $set: { orderStatus: 'Confirmed', paymentStatus: 'Success' } }
            //         );
                    
            //         lastOrder.orderStatus = 'Confirmed';
            //         lastOrder.paymentStatus = 'Success';
            //     } 
            //     else {
                    
            //         await orderModel.updateOne(
            //             { _id: lastOrder._id },
            //             { $set: { orderStatus: 'Failed', paymentStatus: 'Failed' } }
            //         );
            //         console.log("lastOrder.orderStatus === 'Pending && paymentStatus === 'failed ,make both status as Failed");
            //         lastOrder.orderStatus = 'Failed';
            //         lastOrder.paymentStatus = 'Failed';
            //     }
            // } else {
                
            //     if (lastOrder.paymentStatus === 'Pending') {

            //         console.log("lastOrder.orderStatus!=Pending make payment status as Success");

            //         await orderModel.updateOne(
            //             { _id: lastOrder._id },
            //             { $set: { paymentStatus: 'Success' } }
            //         );
                    
            //         lastOrder.paymentStatus = 'Success';
            //     }
            // }
        }
            // console.log(lastOrder)

        res.render('user/order-complete', {
            order: lastOrder,
            products: lastOrder ? lastOrder.products : []
        });
       
    } catch (error) {
        console.log(error)
        throw error;
        next(error)
        res.redirect('/500');
    }
};

const confirmOrder = async (req, res) => {
    const { paymentId } = req.body;
    try {
        // Simulate payment verification logic with Razorpay (replace with actual verification)
        const paymentVerified = true; // Assume payment verification succeeded
        console.log('Payment verification result:', paymentVerified);

        if (paymentVerified) {
            const { user } = req.session;

            // await cartHelper.totalCartPrice(user);

            const lastOrder = await orderModel.findOne({ userId: user })
                .sort({ orderDate: -1 })
                .populate({
                    path: 'products.productId',
                    populate: { path: 'category' }
                })
                //.populate('address'); .billingdetails

                // console.log(lastOrder)
            if (lastOrder) {
                // Check if both order and payment statuses are 'Pending'
                console.log(lastOrder.orderStatus ,  lastOrder.paymentStatus)


                if (lastOrder.orderStatus === 'Pending' && lastOrder.paymentStatus === 'Pending') {
                    // Update both statuses to 'Confirmed'
                    await orderModel.updateOne(
                        { _id: lastOrder._id },
                        { $set: { orderStatus: 'Confirmed', paymentStatus: 'Confirmed' } }
                    );
                    lastOrder.orderStatus = 'Confirmed';
                    lastOrder.paymentStatus = 'Confirmed';
                } else {
                    // Handle other scenarios (e.g., payment failed, statuses already updated)
                    // This block will execute if either status is not 'Pending'
                    console.log('Order or payment status is not Pending');
                }
            }

            // Send JSON response after successful confirmation
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ success: false, message: 'Error confirming order' });
    }
};
        
const userOrderProducts = async (req, res) => {
    try {
        const { id } = req.params; // Extract order ID from request parameters
        const order = await orderModel.findOne({ _id: id }).sort({ orderDate: -1 }).populate({
            path: 'items.product',
            populate: {
                path: 'category',
                model: 'Category'
            }
        })
        
        if (!order) {
            return res.status(404).send('Order not found'); // Handle case when order is not found
        }

        const products = order.items.map(item => item.product);

        // console.log(products)
        
        res.render('user/order-products', {
            order: order,
            products: products // Pass the products to the view
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


const getInvoice = async(req,res) => {
    try {
        const { id } = req.params; // Extract

        console.log("I m in Invoice")
        console.log(id)

        const order = await orderModel.findOne({ _id: id }).sort({ orderDate: -1 }).populate({
            path: 'items.product',
            populate: {
                path: 'category',
                model: 'Category'
            }
        })
        
        if (!order) {
            return res.status(404).send('Order not found'); //  when order is not found...
        }
       
        res.render('user/order-invoice', {
            order: order
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

//cancel/return

const cancelOrder = async (req, res) => {
    try {
        const user = req.session.user._id;
        const orderId = req.params.id;

        let status = "Cancelled";
        const order = await orderModel.findOne({ _id: orderId });
      
        if(order.orderStatus === "Delivered") {
            status = "Returned";
        }

        await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { orderStatus: status , paymentStatus : (order.paymentMethod == 'Razorpay') ? "Refunded"  : "Cancelled"} });

        if(status === "Cancelled") {
            for(const row of order.items) {
                await productModel.updateOne(
                    { '_id': row.product._id },
                    { $inc: { 'stock': row.quantity } }
                );
            }
        }

        if ((order.paymentMethod === 'Razorpay') || (order.paymentMethod !== 'Razorpay' && status === "Returned")) {
            await userModel.updateOne(
                { _id: user }, 
                {
                    $inc: { wallet: order.totalprice },
                    $push: {
                        walletHistory: {
                            date: Date.now(),
                            amount: order.totalprice,
                            message: order.paymentMethod !== "Razorpay" ? "Refund for returned order (COD)" : "Refund for "  + status + " order (Razorpay)"
                        }
                    }
                }
            );
        }

        res.status(200).json({ success: true, message: `Order has been ${status.toLowerCase()}.` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


//sales report
const getSalesReport = async (req, res) => {
    try {
        const { from, to, period, sortData, sortOrder } = req.query;
        const currentDate = new Date();
        let startDate, endDate;

            console.log("I'm in sales report")
        // Determine startDate and endDate based on period
        switch (period) {
            case 'daily':
                startDate = new Date(currentDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 6); 
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'yearly':
                startDate = new Date(currentDate.getFullYear(), 0, 1);
                endDate = new Date(currentDate.getFullYear(), 11, 31);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(1970, 0, 1); // Default start date if none is provided
                endDate = new Date();
                break;
        }

        const conditions = {
            orderStatus: 'Delivered' // Add this condition to filter only 'delivered' orders
        };
        
        if (from && to) {
            conditions.orderDate = {
                $gte: new Date(from),
                $lte: new Date(to)
            };
        } else if (from) {
            conditions.orderDate = {
                $gte: new Date(from)
            };
        } else if (to) {
            conditions.orderDate = {
                $lte: new Date(to)
            };
        } else if (startDate && endDate) {
            conditions.orderDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

       
        const sort = {};
        if (sortData) {
            sort[sortData] = sortOrder === "Ascending" ? 1 : -1;
        } else {
            sort['orderDate'] = sortOrder === "Ascending" ? 1 : -1;
        }

        // console.log(conditions)
        // console.log(sort)

        const orders = await orderModel.find(conditions).sort(sort);

        console.log("Delivered Orders" ,orders)

        const overallSalesCount = orders.length;
        console.log(overallSalesCount)

        let overallOrderAmount = 0;
        let overallDiscountAmount = 0;

        for (const order of orders) {
            overallOrderAmount += order.totalPrice;
            overallDiscountAmount += order.discountAmount || 0;
        }

        // console.log(overallOrderAmount)
        // console.log(overallDiscountAmount)

        let page = Number(req.query.page);
        if (isNaN(page) || page < 1) {
            page = 1;
        }

        const orderCount = await orderModel.countDocuments(conditions);
        const limit = req.query.seeAll === "seeAll" ? orderCount : paginationHelper.SALES_PER_PAGE;
        const filteredOrders = await orderModel.find(conditions)
            .sort(sort)
            .skip((page - 1) * paginationHelper.SALES_PER_PAGE)
            .limit(limit);

        console.log(filteredOrders)
        
        res.render('admin/sale-report', {
            admin: true,
            moment,
            shortDateFormat: 'DD-MM-YYYY', // Pass the date format
            orders: filteredOrders,
            from: from,
            to: to,
            period: period,
            currentPage: page,
            hasNextPage: page * paginationHelper.SALES_PER_PAGE < orderCount,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: Math.ceil(orderCount / paginationHelper.SALES_PER_PAGE),
            sortData: sortData,
            sortOrder: sortOrder,
            overallSalesCount: overallSalesCount,
            overallOrderAmount: overallOrderAmount,
            overallDiscountAmount: overallDiscountAmount
        });


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const getAdd_Address = (req,res)=>{
    // const isMaster  =  req.params.isM ? 1 : 0
    res.render("user/order-add-address")
  };

const addAddress = async (req, res) => {
    try {
    //   console.log('Request body:', req.body); // Log the request body to debug
      console.log('Session user ID:', req.session.user ? req.session.user._id : 'No session user'); // Log session user ID
  
      if (!req.session.user) {
        res.status(401).send('Unauthorized: No session user');
        return;
      }
  
      const address = {
        name: req.body.name,
        mobile: req.body.mobile,
        pincode: req.body.pincode,
        houseName: req.body.houseName,
        cityOrTown: req.body.cityOrTown,
        district: req.body.district,
        state: req.body.state,
        country: req.body.country,
      };
  
      const result = await userModel.updateOne(
        { _id: req.session.user._id },
        { $push: { address: address } }
      );
  
      console.log('Address update result:', result);
  
      res.redirect('/checkout');
    } catch (error) {
      console.error('Error adding address:', error);
      res.status(500).send('Add Address - Internal Server Error');
    }
  };

module.exports = { getCheckout, placeOrder,userOrderProducts,getAdd_Address,addAddress ,getConfirmOrder,
    confirmOrder, getSalesReport,cancelOrder,getInvoice};
