const express=require('express')
const session=require('express-session')
const flash = require('express-flash');
const app=express()
const {v4:uuid4}=require('uuid')
require('dotenv').config()
const mongoose=require('mongoose')
const path=require('path')
const userAuthRoute=require('./routes/userRouter')
const adminAuthRoute=require('./routes/adminRouter')
const errorHandler = require('./middleware/errorHandler'); 

//setup mongodb connection
const db= mongoose.connect(process.env.DB_URL)
db.then(()=>{
  console.log('database connected')
})
.catch((err)=>{
  console.log('error connecting to mongodb',err);
})

//setup express middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
  secret:uuid4(),
  resave:false,
  saveUninitialized:true
}))

// Flash messages middleware
app.use(flash());

app.use((req,res,next) =>{
  res.locals.message = req.flash();
  next();
});

// Flash messages middleware

//setup view engine and static file serving
app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'));
app.use('/public',express.static(path.join(__dirname,'/public')))

//setting local variable
app.use((req,res,next)=>{
      // res.locals.userLoggedin=req.session.user
      res.locals.user=req.session.user
      res.locals.productCount=req.session.productCount
      res.locals.wishlistCount=req.session.wishlistCount
   next()
})

//require routes
app.use('/',userAuthRoute)
app.use('/',adminAuthRoute)


//error handling middleware (must be used after all other middleware/routes)//7/6/24
app.use(errorHandler);

///start server
const port=process.env.port||3001

app.listen(port,()=>{
  console.log(`server running on http://localhost:${port}`);
})

