const Razorpay = require('razorpay');
const{ RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET} = process.env;
// Initialize Razorpay instance
const razorpayInstance = new Razorpay({key_id: RAZORPAY_KEY_ID , key_secret : RAZORPAY_KEY_SECRET})

// Create a Razorpay order
const createRazorpayOrder = async (orderId,totalPrice, currency = 'INR') => {
    try {
        const id  = "" + orderId;

        const options = {
            amount: totalPrice * 100, // amount in the smallest currency unit (paise)
            currency,
            payment_capture: 1 ,// auto capture
            receipt : id
        };

        const order = await razorpayInstance.orders.create(options);
      
        return order;
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

module.exports = {
    createRazorpayOrder
};

