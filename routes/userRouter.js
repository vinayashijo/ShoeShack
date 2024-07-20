const express=require('express')
const router=express.Router()
const userController=require('../controller/userC/userController')
const cartController=require('../controller/userC/cartController')
const orderController=require('../controller/userC/orderController')
const couponController=require('../controller/adminC/couponController')
const wishlistController=require('../controller/userC/wishlistController')
const isAuthenticated = require('../middleware/userAuth')
const isBlocked = require('../middleware/isBlocked')

const otpHelper = require('../helper/otpHelper')

//userside-------------------------------------------------------------------
router.get('/',userController.loadhome)

router.get('/userregister',userController.loadregister)


router.get('/userlogin',userController.loadlogin)
router.post('/sendotp',otpHelper.sendOtp)
router.post('/verifyotp',otpHelper.verify)

router.post("/usersignup",userController.CreateUser)

router.post('/userlogin',userController.loaduserlogin )
router.get('/usershop',userController.loadshop)
router.get('/userlogout',userController.logoutUser)

router.get('/viewwishlist',isAuthenticated.userAuth,isBlocked.isBlocked,wishlistController.viewWishlist)
router.post('/addtowishlist',isAuthenticated.userAuth,isBlocked.isBlocked,wishlistController.addtowishlist)

//wishist 
// router.post('/wishlist',isAuthenticated.userAuth,isBlocked.isBlocked,cartController.addToWishlist);
router.get('/viewwishlist',isAuthenticated.userAuth,isBlocked.isBlocked,wishlistController.viewWishlist);
router.post('/removewishlist',isAuthenticated.userAuth,isBlocked.isBlocked, wishlistController.removeWishlist);

//product -cart 
router.get('/viewcart',isAuthenticated.userAuth,isBlocked.isBlocked,cartController.viewcart)
router.get('/getcart', isAuthenticated.userAuth,isBlocked.isBlocked,cartController.getcart); // New route to get cart data
router.get('/productdetails/:id',userController.loadproductdetailspage)
router.post('/addtocart',isAuthenticated.userAuth,isBlocked.isBlocked,cartController.addToCart)
router.post('/updatequantity',isAuthenticated.userAuth,isBlocked.isBlocked,cartController.updateQuantities);
router.post('/decart',isAuthenticated.userAuth,isBlocked.isBlocked, cartController.deCart);

 router.get('/view-order-products/:id',isAuthenticated.userAuth,isBlocked.isBlocked,orderController.userOrderProducts)
 router.patch('/cancelorder/:id',isAuthenticated.userAuth,isBlocked.isBlocked,orderController.cancelOrder)

//product Checkout
router.get('/checkout', isAuthenticated.userAuth,isBlocked.isBlocked,orderController.getCheckout);

//coupon

router.post('/applycoupon',isAuthenticated.userAuth,isBlocked.isBlocked,couponController.applyCoupn)
router.get('/cancelCoupon',isAuthenticated.userAuth,isBlocked.isBlocked,couponController.cancelCouponuser)

//orders address
router.get('/orderaddaddress',isAuthenticated.userAuth,isBlocked.isBlocked,orderController.getAdd_Address);
router.post('/orderaddaddress', isAuthenticated.userAuth,isBlocked.isBlocked,userController.orderaddAddress);

router.get('/addaddress',isAuthenticated.userAuth,isBlocked.isBlocked, userController.getAdd_Address);
router.post('/addaddress',isAuthenticated.userAuth,isBlocked.isBlocked, userController.addAddress);

router.get('/editaddress/:id', isAuthenticated.userAuth,isBlocked.isBlocked,userController.getEditAddress);
router.post('/editaddress/:id', isAuthenticated.userAuth,isBlocked.isBlocked,userController.editAddress);
router.get('/removeAddress/:id',isAuthenticated.userAuth,isBlocked.isBlocked,userController.removeAddress)

//profle
router.get('/getprofile',isAuthenticated.userAuth,isBlocked.isBlocked, userController.getUserProfile);
router.put('/saveprofile', isAuthenticated.userAuth,isBlocked.isBlocked,userController.saveProfile);
router.put('/reset-password', isAuthenticated.userAuth,isBlocked.isBlocked,userController.resetPassword);
router.post('/depositwallet',userController.depositWallet);

//order
router.post('/placeorder',isAuthenticated.userAuth,isBlocked.isBlocked,orderController.placeOrder);
router.get('/confirmorder/:status',isAuthenticated.userAuth,isBlocked.isBlocked,orderController.getConfirmOrder);
router.get('/paymentfailed/:status',isAuthenticated.userAuth,isBlocked.isBlocked,orderController.getConfirmOrder);
router.get('/viewinvoice/:id' , isAuthenticated.userAuth ,isBlocked.isBlocked,orderController.getInvoice);


module.exports=router
