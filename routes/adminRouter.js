const express=require('express')
const router=express.Router()
const nocache=require('nocache')
const bcrypt=require('bcrypt')
const upload=require('../middleware/multer')

const isAdmin=require('../middleware/adminAuth')

const adminController=require('../controller/adminC/adminController')
const categoryController=require('../controller/adminC/categoryController')
const productController=require('../controller/adminC/productController')
const customerController=require('../controller/adminC/customerController')
const orderController = require('../controller/userC/orderController.js')
const couponController = require('../controller/adminC/couponController.js')

//adminside---------------------------------------------
router.get('/adminlogin',adminController.loadlogin)
router.get('/admindashboard',isAdmin,adminController.loadAdminDashboard )
router.post('/admindashboard',adminController.loadAdminDashboard)
router.get('/adminlogout',adminController.logoutAdmin)

//categoryside--------------------------------------------------------------------------
router.get('/categorylist',isAdmin,categoryController.loadcategorylist)
router.post('/addtocategory',isAdmin,categoryController.loadaddToCategory)
router.patch('/unlist',categoryController.loadunlistorlist)
router.get('/editcategory',isAdmin,categoryController.loadeditcategorypage)
router.post('/updatecategory/:id',isAdmin,categoryController.updateCategory)

//productside------------------------------------------------------------------------------------------
router.get('/productlist',isAdmin,productController.loadproductlist)
router.get('/addproductpage',isAdmin,productController.loadaddProductPage)
router.post('/addproducts',upload.array("images",5),productController.addproducts)
router.patch('/productunlist',isAdmin,productController. blockOrUnblockproduct)
router.get('/editproductpage',isAdmin,productController.loadeditProductPage)
router.post('/updateproduct/:id',upload.array("images",5),productController.productupdate)
router.get('/customers',isAdmin, customerController.loadcustomers);
router.post('/customerunlist/:id',isAdmin,customerController.blockOrUnblockcustomer)
router.post('/delete-image',isAdmin,productController.deleteImage)

//orders
router.get('/orders',isAdmin,adminController.getAdminOrderList)
router.get('/orderdetails/:id',isAdmin,adminController.orderDetails)
// router.patch('/updatestatus/:orderId',isAdmin,adminController.updateStatus)
router.put('/updatestatus/:orderId', isAdmin, adminController.changeOrderStatus);
// updatestatus
//coupons
router.get('/coupons',isAdmin,couponController.getCoupons)
router.get('/addcoupon',isAdmin,couponController.getAddCoupon)
router.post('/addcoupon',isAdmin,couponController.addCoupon)
router.get('/editcoupon', isAdmin, couponController.getEditCoupon);
router.post('/editCoupon/:id', isAdmin, couponController.editCoupon);
router.patch('/cancelcoupon', isAdmin, couponController.cancelCoupon);
router.patch('/couponunlist', isAdmin, couponController.blockOrUnblockCoupon);

//sales report
// router.get('/salereport',isAdmin,orderController.getSalesReport)
router.get('/salesreport',isAdmin,adminController.getSalesReport)


module.exports=router;