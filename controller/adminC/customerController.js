const userModel=require("../../model/userModel")


//customer or user page mangement--------------------------------------------
const loadcustomermanagement = async (req, res) => {
  try {
    const data=await userModel.find()
    res.render("admin/customer-management",{data:data});
  } catch (error) {
    console.log("Error in customer management:", error);
    res.status(500).send("Internal Server Error");
  }
}

//list & unlist user-----------------------------------------------------------
const  blockOrUnblockcustomer= async (req, res) => {
  try {
      const id = req.query.id;
      const user = await userModel.findOne({ _id: id });

      if (!id || !user) {
          return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      if (user.isActive === true) {
          await userModel.updateOne({ _id: id }, { $set: { isActive: false } });
          return res.json({ success: true, flag: 1 });
      } else { 
          await userModel.updateOne({ _id: id }, { $set: { isActive: true } });
          return res.json({ success: true, flag: 0 });
      }
  } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



module.exports={
  loadcustomermanagement,
  blockOrUnblockcustomer,
}