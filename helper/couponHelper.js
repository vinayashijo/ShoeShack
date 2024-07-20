const { error } = require('console');
const couponModel = require('../model/couponModel')

module.exports = {
    discountPrice: async(couponId,cartTotal)=>{
        try
        {
        // console.log("I m in discountPrice")
            const coupon = await couponModel.findById(couponId)
            if(!coupon){
                return{
                    discountAmount:0,
                    discountTotal : cartTotal
                }
            }
        let discountAmount =0;

        if(coupon.discountType === "percentage"){
            discountAmount = (coupon.discount/100)*cartTotal;
            
            if(discountAmount > coupon.maxDiscount )
            {
                discountAmount = coupon.maxDiscount //added on 6/7/24
            }
        }
        else if(coupon.discountType==="fixed-amount"){
            discountAmount = coupon.discount
        }
        
        const discountedTotal = cartTotal-discountAmount;

        return {discountAmount,discountedTotal}
    }
    catch(err)
    {
        console.log(error)
        //error.status = 500; // Set the status code to 404
        //next(error); // Pass the error to the next middleware (means : errorhandler.js in middleware folder)
    }
    
}
}