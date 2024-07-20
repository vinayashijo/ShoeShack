module.exports = {
  userAuth : (req , res, next) =>{
      if(!req.session.user){
          return res.redirect('/userlogin')
      }
      next()
  },
  adminAuth : (req ,res , next) =>{
      if(!req.session.admin){
          return res.redirect('/adminlogin')
      }
      next()
  },
  userLoggedout : (req ,res ,next)=>{
      if(req.session.user){
          req.session.user = null;
          return res.redirect('/')
      }
      next()
  },
  adminLoggedout : (req ,res, next)=>{
      if(req.session.admin){
            req.session.admin = null;
            return res.redirect('/adminLogin')
      }
      next()
  }
}