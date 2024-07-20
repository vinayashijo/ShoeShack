const mongoose=require('mongoose')

const userschema= new mongoose.Schema({
name:{
  type:String,
  required:true
},
email:{
  type:String,
  required:true
},
isVerified:{
  type:String,
  required:true
},
mobile:{
  type:Number,
  required:true
},
password:{
  type:String,
  required:true
},
address:[
{
      _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: function () {
        return new mongoose.Types.ObjectId();
      }
    },
  name:{type:String},
  mobile:{type:Number},
  pincode:{type:Number},
  houseName:{type:String},
  cityOrTown:{type:String},
  district:{type:String},
  state:{type:String},
  country:{type:String}
}],
isActive: {
  type: Boolean,
  default: true,
},

wallet : {
  type : Number ,
  
},
walletHistory : [{
  date : {
      type : Date,
  },
  amount : {
      type : Number
  },
  message : {
      type : String
  }
}],
referralCode: {
  type: String,
  unique: true // Ensure referral code is unique
},
referredBy: {
  type: mongoose.Schema.Types.ObjectId, // Store the ID of the referring user
  ref: 'user' // Reference the same model
},
isReferred: {
  type: Boolean,
  default: false // Indicate if the user was referred
},
googleId:{
  type: String
},
isGoogleAuthenticated:{
  type: Boolean,
  default : false
}
})

const User= mongoose.model("User",userschema)

module.exports= User;