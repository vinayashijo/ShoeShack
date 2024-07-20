const mongoose = require('mongoose')
const moment = require('moment')  
const orderSchema = mongoose.Schema({
    trackingId:{
        type:String,
        default:function(){
           return Math.floor(100000 + Math.random() * 900000).toString();
        },
        unique:true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product', // Referring to the 'Product' model
                required: true
            },
            price: {
                type: Number,
                default: 0,                
            },
            quantity: {
                type: Number,
                required: true,
            },
            status: {
                type: String,
                enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Returned"],
                default: "Pending",
            },
            itemOrderDate: {
                type: Date,
                default: Date.now,
                get: function(val){
                    return moment(val).format('DD-MM-YYYY')
                }
            }
        }
    ],
    totalprice: {
        type: Number,
        default: 0
    },
    billingdetails:{
        name:{type:String},
        mobile:{type:Number},
        pincode:{type:Number},
        houseName:{type:String},
        cityOrTown:{type:String},
        district:{type:String},
        state:{type:String},
        country:{type:String}
    },
    orderStatus : {
        type : String ,
        enum: ["Pending", "Confirmed"  ,"Shipped", "Delivered", "Cancelled", "Returned","Failed"],
        default : 'Pending'
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Success', 'Failed','Refunded' ,'Cancelled'],
        default: 'Pending'
    },
    paymentReference : {
        type : String
    },
    discountAmount : { 
        type : Number,
        default : 0
    },
    walletUsed : {
        type : Number,
        required : false 
    },
    amountPayable : {
        type : Number,
        required : false 
    },
    orderDate: {
        type: Date,
        default: Date.now,
        get: function(val){
            return moment(val).format('DD-MM-YYYY')
        }
    },
    ReturnReason: {
        type: String,
        required: false,
        default: ''
    }

})



module.exports= mongoose.model('Order',orderSchema)