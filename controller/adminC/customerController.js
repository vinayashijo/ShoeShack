const userModel=require("../../model/userModel")
const paginationHelper=require('../../helper/paginationHelper')

//customer or user page mangement--------------------------------------------
const loadcustomermanagement = async (req, res) => {
  try {
    // console.log("load customermanagement")

    let { sortData,sortOrder } = req.query;
    const { search = '' } = req.query;
    const limit = 10;

    // console.log(req.query)

    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {                                  
        page = 1;
    }

    if(!sortData)
    {  
      sortData = "name"
    }
    const sort = {};
    sort[sortData] =1

    if (sortData) {
        if (sortOrder === 'asc') {
            sort[sortData] = 1;
        } else {
            sort[sortData] = -1;
        }
    }

    // search criteria
    const searchCriteria = {};
    if (search) {
        searchCriteria.$or = [
            { name: { $regex: search, $options: 'i' } },
            { 'email': { $regex: search, $options: 'i' } }
        ];
    }

    const filteredData= await userModel.find(searchCriteria)
    .sort(sort) 
    .skip((page - 1) * paginationHelper.USERS_PER_PAGE)
    .limit(limit); 

    const usersCount = await userModel.countDocuments(searchCriteria);  
    res.render("admin/customer-management",{
          data:filteredData,
          currentPage : page,
          hasNextPage : usersCount  >  page * paginationHelper.ORDER_PER_PAGE,
          hasPrevPage : page > 1,
          nextPage : page + 1,
          prevPage: page - 1,
          lastPage : Math.ceil(usersCount/ paginationHelper.ORDER_PER_PAGE),
          search : search,
          sortData: sortData,
          sortOrder: sortOrder}
    );

  } catch (error) {
    // console.log("Error in customer management:", error);
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