const couponModel=require('../../model/couponModel')
const cartModel=require('../../model/cartModel')
const couponHelper=require('../../helper/couponHelper')
const paginationHelper=require('../../helper/paginationHelper')

const moment = require("moment")

module.exports={
    getCoupons: async (req, res,next) => {
        try {
        
            const { search, sortData, sortOrder } = req.query;
            const condition = {};          
           
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
                page = 1;
            }

            if (search) {
                condition.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                    { discountType: { $regex: search, $options: "i" } }
                ];
            }
            const sort = {};
            if (sortData) {
                if (sortOrder === 'asc') {
                    sort[sortData] = 1;
                } else {
                    sort[sortData] = -1;
                }
            }

            const couponsCount = await couponModel.countDocuments(condition);
            const limit =  paginationHelper.SALES_PER_PAGE;

            // console.log(couponsCount)
            // console.log(limit)
            // console.log(sort)
            // console.log(condition)

            const filteredCoupons = await couponModel.find(condition)
                .sort(sort)
                .skip((page - 1) * paginationHelper.SALES_PER_PAGE)
                .limit(limit);             
                            
                res.render('admin/coupons', {
                admin: true,
                coupons: filteredCoupons,
                moment,
                shortDateFormat: 'DD-MM-YYYY', 
                currentPage: page,
                hasNextPage: page * paginationHelper.SALES_PER_PAGE < couponsCount,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(couponsCount / paginationHelper.SALES_PER_PAGE),
                sortData: sortData,
                sortOrder: sortOrder,
                search: search,
            });
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    getAddCoupon: (req, res) => {
        const sdate = new Date().toISOString().split('T')[0]; // Example starting date as today
        const edate = ''; // Example expiry date
      
        
        res.render('admin/add-coupon', { sdate: sdate,
            edate: edate,
            coupon: {}, // Ensure to pass a default coupon object
            admin: true,
            err: req.flash('err')
        });
    },
    addCoupon : async (req, res,next) => {
        try {
          const { name, description, startingDate, expiryDate, minimumAmount,maxDiscount, discountType, discount } = req.body;
          const exist = await couponModel.findOne({ name: name.toUpperCase() });
      
            if(discountType ==="percentage" && discount >=100)
            {
                return res.redirect('/addcoupon?error=more-discount');
            }
           
            if (exist) {
                return res.redirect('/addcoupon?error=coupon-exists');
            }
   
            if(discountType=="fixed-amount" && discount>=maxDiscount )
            {
                return res.redirect('/addcoupon?error=more-discount');
            }
          
          const coupon = new couponModel({
            name: name.toUpperCase(),
            description: description,
            startingDate: startingDate,
            expiryDate: expiryDate,
            minimumAmount: minimumAmount,
            maxDiscount :maxDiscount,
            discountType: discountType,
            discount: discount,
          });
      
          await coupon.save();
          res.redirect('/coupons');
        } catch (error) {
           console.log(error);
           throw error;
            next(error)
        }
      },
      
    getEditCoupon: async (req, res) => {
        try {
            const { id } = req.query;
            const coupon = await couponModel.findOne({ _id: id });

            // startingDate
            // console.log(coupon)

            res.render('admin/edit-coupon', {
                admin: true,
                coupon: coupon
            });

        } catch (error) {
            res.redirect('/500');
        }
    },
    editCoupon: async (req, res) => {
        try {
            // console.log("editcoupon")
            const id = req.params.id;

            const { name, description, startingDate, expiryDate, minimumAmount, maxDiscount,discountType, discount } = req.body;
            const updatedName = name.toUpperCase();

            // Check if the provided coupon name already exists
            const existingCoupon = await couponModel.findOne({ name: updatedName });
          
            // If the same coupon name exists and it's not the current coupon being edited
            if (existingCoupon && existingCoupon._id.toString() !== id) {
                console.log("coupon-exists")
                return res.redirect('/editcoupon?error=coupon-exists');
            }
            if( (discountType=="percentage" && discount>=100 ) || (discountType=="fixed-amount" && discount>=minimumAmount ) )
            {
                return res.redirect('/editcoupon?error=more-discount');
            }

            
            await couponModel.updateOne({ _id: id }, {
                $set: {
                    name: name.toUpperCase(),
                    description: description,
                    startingDate: startingDate,
                    expiryDate: expiryDate,
                    minimumAmount: minimumAmount,
                    maxDiscount : maxDiscount,
                    discountType: discountType,
                    discount: discount
                }
            });
            res.redirect('/coupons');
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal Server Error' });
            // next(error); // Pass the error to the error-handling middleware
        }
    },
  
    cancelCoupon: async (req, res) => {
        try {
            const { user } = req.session;
            // console.log("cancelCoupon")
            // Update the user's cart to remove the applied coupon (removes coupon field : id of coupon--vv)
            await cartModel.updateOne({ userId: user }, { $unset: { coupon: 1 } });
    
            res.json({ success: true, message: 'Coupon canceled successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    },
    
    //list & unlist coupon-----------------------------------------------------------
    blockOrUnblockCoupon :  async (req, res) => {
    try {
        // console.log("block Unblock Coupon")

        const id = req.query.id;
        const coupon = await couponModel.findOne({ _id: id });
  
        if (!id || !coupon) {
            return res.status(400).json({ success: false, message: 'Invalid Coupon ID' });
        }
        if (coupon.status === true) {
            await couponModel.updateOne({ _id: id }, { $set: { status: false } });
            return res.json({ success: true, flag: 1 });
        } else { 
            await couponModel.updateOne({ _id: id }, { $set: { status: true } });
            return res.json({ success: true, flag: 0 });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
    applyCoupn:async(req,res)=>{
        try{
            // console.log("i m in cart-applycoupon ")
            const {couponCode,total}=req.body
            const {user}=req.session
            const coupon= await couponModel.find({name:couponCode,status:true})

            // console.log("applyCoupn ",coupon)
            
            if(coupon && coupon.length>0){
                const now=new Date()
                if(coupon[0].expiryDate>= now && coupon[0].startingDate<=now){

                    const userIds=coupon[0].users.map((userId)=>String((userId)))

                    const userExist=userIds.includes(user)
                    if(userExist){
                        res.json({success:false,message:"Coupon already used by the user.Please select another one!"})
                    }
                    else
                    {
                        const couponId = coupon[0]._id
                        const discountType =coupon[0].discountType
                        const discount =coupon[0].discount
                        const maxDiscount =coupon[0].maxDiscount
                        let discountAmount = discount
                        const minAmount = coupon[0].minimumAmount
                        if(total<minAmount){
                            // console.log("Minimum amount not reached",total,coupon[0].minimumAmount)

                            return res.json({success:false,message:"Minimum amount not reached"})
                        }
                    
                        const cart=await cartModel.findOne({userId:user})
                        let discounted
                        if(couponId){
                            discounted=await couponHelper.discountPrice(couponId,total)
                                await cartModel.updateOne({userId:user},{
                                    $set:{coupon:couponId,
                                        totalPrice: discounted.discountedTotal
                                    }
                                })
                                res.json({success:true,message:'Available',discounted:discounted,coupona:coupon[0].minimumAmount})
                        }

                    }
                    }
                    else
                    {
                            res.json({success:false,message:"Invalid Coupon, out Dated"})
                    }
            }
            else{
                res.json({success:false,message:"Invalid Coupon"})
            }
        }catch(error){
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    },
    
    //Cancel the coupon in user side
    cancelCouponuser:async(req,res)=>{
            try {
                const { user } = req.session;
        
                await cartModel.updateOne({ userId: user }, { $unset: { coupon: 1 } });
        
                res.json({ success: true, message: 'Coupon canceled successfully', });
            } catch (error) {
                res.status(500).json({ success: false, error: 'Internal Server Error' });
            }
    },
       
}