require('dotenv').config();
const adminModel=require('../../model/adminModel')
const orderModel=require('../../model/orderModel')
const productModel=require('../../model/productModel')
const paginationHelper=require('../../helper/paginationHelper')
const moment = require('moment');

//loginpage------------------------------------------------------------------------------

const loadlogin = function(req, res) {
  res.render('admin/admin-login', { errorMessage: req.flash('errorMessage') });
};

const logoutAdmin = async (req, res) => {
  try{

    req.session = null
    res.redirect('/adminlogin');

}catch(error){
  console.log(error)
}
}


//back to admin dahsboard page---------------------------------------------------
const loadAdminDashboard = async (req, res) => {
  try {

    // console.log("I m into adminloadDashboard")
    // Fetch admin details
     let adminEmail = ""
     if( req.session.admin)
      {
        adminEmail  = req.session.admin.email
      }
      else
      {
        adminEmail  =req.body.email
      }

    const admin = await adminModel.findOne({ email:adminEmail  }); // Replace with actual admin model
    
    if (admin) {
      req.session.admin = admin;
      // Fetch delivered orders
      const orders = await orderModel.find({ orderStatus: "Delivered" }).sort({ orderDate: 1 });
      // Initialize variables for calculations
      let overallSalesCount = orders.length;
      let overallOrderAmount = 0;
      let currentMonthEarning = 0.0;
      let productObj = {};

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Calculate overall order amount, current month earning, and product count
      orders.forEach(order => {
        overallOrderAmount += order.totalprice || 0;
        const orderDate =  formatDateString(order.orderDate)
        console.log(orderDate.getMonth, currentMonth)
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          currentMonthEarning += order.totalprice || 0;
        }

        order.items.forEach(item => {
          productObj[item.product] = (productObj[item.product] || 0) + 1;
        });
      });

      const overallProductCount = Object.keys(productObj).length;
      // Fetch last year's sales data grouped by month
      const lastYearDate = moment(currentDate).subtract(1, 'year').toDate();
      const lastYearOrders = await orderModel.aggregate([
        {
          $match: {
            orderDate: {
              $gte: lastYearDate,
              $lt: currentDate
            },
            orderStatus: 'Delivered'
          }
        },
        {
          $group: {
            _id: { $month: '$orderDate' },
            totalSales: { $sum: '$totalprice' }
          }
        }
      ]);

      const months = moment.months();
      const salesData = months.map((month, index) => {
        const monthIndex = index + 1;
        const sales = lastYearOrders.find(item => item._id === monthIndex);
        
        return {
          month: month,
          totalSales: sales ? sales.totalSales.toFixed(2) : '0.00'
        };
      });

      // get last five years' sales data grouped by year , vv
      const lastFiveYears = [];
      for (let i = 0; i < 5; i++) {
        lastFiveYears.push(currentYear - i);
      }

      const lastFiveYearDate = moment(currentDate).subtract(5, 'year').toDate();
      const lastFiveYearOrders = await orderModel.aggregate([
        {
          $match: {
            orderDate: {
              $gte: lastFiveYearDate,
              $lt: currentDate
            },
            orderStatus: 'Delivered'
          }
        },
        {
          $group: {
            _id: { $year: '$orderDate' },
            totalSales: { $sum: '$totalprice' }
          }
        }
      ]);

      // console.log("load lastFiveYearOrders" ,lastFiveYearOrders)

      const salesDataYearly = lastFiveYears.map(year => {
        const sales = lastFiveYearOrders.find(item => item._id === year);
        return {
          year: year,
          totalSales: sales ? sales.totalSales.toFixed(2) : '0.00'
        };
      });

      // Fetch pie chart data grouped by payment method
      const pieChartData = await orderModel.aggregate([
        {
          $group: {
            _id: '$paymentMethod',
            totalSales: { $sum: '$totalprice' }
          }
        },
        {
          $project: {
            _id: 0,
            paymentMethod: '$_id',
            totalSales: { $toDecimal: { $toString: '$totalSales' } }
          }
        }
      ]);

      pieChartData.forEach(data => {
        data.totalSales = parseFloat(data.totalSales).toFixed(2);
      });
      console.log("load pieChartData" ,pieChartData)

      // Render the dashboard EJS template with data
      res.render('admin/dashboard-test', {
        moment,
        orders,
        salesData: JSON.stringify(salesData),
        pieChartData: JSON.stringify(pieChartData),
        salesDataYearly: JSON.stringify(salesDataYearly),
        overallSalesCount,
        overallOrderAmount: overallOrderAmount.toFixed(2),
        currentMonthEarning: currentMonthEarning.toFixed(2),
        overallProductCount
      });

    } else {
      res.redirect("/adminLogin");
    }
  } catch (error) {
    console.error('Error in loadAdminDashboard:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

const backtodashboard=async(req,res)=>{
  if(req.session.admin){
    res.render('admin/admin-dashboard')
  }else{
    res.redirect("/adminlogin")
  }
}

//back to admin dahsboard page---------------------------------------------------
// const dashboard=async(req,res)=>{
//   if(req.session.admin){

//     const currentDate = new Date();

//     const startDate = new Date(currentDate.getFullYear(), 0, 1);
//     const endDate = new Date(currentDate.getFullYear(), 11, 31);

    

//     res.render('admin/admin-dashboard',{orders:orders})
//   }else{
//     res.redirect("/adminlogin")
//   }
// }

//product list page-----------------------------------------------------------------
const loadproductlist=function(req,res){
  res.render('admin/product-list');
}

//orders
const getAdminOrderList = async (req, res) => {
  try {
    // console.log("getadminOrderList")

      // const { sortData,sortOrder } = req.query;

      const { search = '' } = req.query;
      const limit = 10;
      const query = {};

    

      let page = Number(req.query.page);
      if (isNaN(page) || page < 1) {
          page = 1;
      }

      // search criteria
      const searchCriteria = {};
      if (search) {
          searchCriteria.$or = [
              { trackingId: { $regex: search, $options: 'i' } },
              { 'billingdetails.name': { $regex: search, $options: 'i' } }
          ];
      }
    //   if (search) {
    //     query.trackingId = new RegExp(search, 'i'); 
    // }

      const ordersCount = await orderModel.find(searchCriteria).count();
      const orders = await orderModel.find(searchCriteria)
          .sort({orderDate : 1})
          .skip((page - 1) * paginationHelper.ORDER_PER_PAGE)
          .limit(paginationHelper.ORDER_PER_PAGE)
          .populate('userId')
          .populate('items.product')

       res.render('admin/orders', {
          orders: orders,
          moment: moment, // Pass moment to the view
          shortDateFormat: 'DD-MM-YYYY', // Pass the date format
          currentPage : page,
          hasNextPage : ordersCount  >  page * paginationHelper.ORDER_PER_PAGE,
          hasPrevPage : page > 1,
          nextPage : page + 1,
          prevPage: page - 1,
          lastPage : Math.ceil(ordersCount/ paginationHelper.ORDER_PER_PAGE),
          search : search
          // sortData: sortData,
          // sortOrder: sortOrder,
      });
  } catch (error) {
      console.log(error);
  }
};


  const orderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderModel.findOne({ _id: id })
        .populate("userId")
            .populate({
                path: 'items.product',
                populate: {
                    path: 'category',
                    model: 'Category' // Ensure the correct model is used
                }
            });

          console.log(order)
        res.render('admin/orders-detail', { order });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
  };

// const changeOrderStatus = async (req, res) => {

//   // Define allowed transitions
// const allowedTransitions = {
//   'Pending': ['Confirmed', 'Cancelled'],
//   'Confirmed': ['Shipped', 'Delivered'],
//   'Shipped': ['Delivered'],
// };

//   try {
//     const { orderId } = req.params;

//       const { status } = req.body;
//       console.log("changeOrderStatus",status,orderId)

//       if (status === 'Cancelled') {
//           // if the order is cancelled 
//           const order = await orderModel.findOne({ _id: orderId });
//           console.log(order)
          
//           for (let item of order.items) {
//             console.log(" item.quantity ", item.quantity )
//               await productModel.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
//           }
//           await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { 'items.$[].status': status } });

//       } else {
//           await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { 'items.$[].status': status } });
//       }

//       const newStatus = await orderModel.findOne({ _id: orderId });
//       console.log("newstatus",newStatus,newStatus.items[0].status )

//       res.status(200).json({ success: true, status: newStatus.items[0].status });

//   } catch (error) {
//       console.log(error);
//   }
// };

const changeOrderStatus = async (req, res) => {
  // Define allowed transitions

  console.log("i m in changeOrderStatus")
  const allowedTransitions = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Shipped', 'Delivered'],
    'Shipped': ['Delivered'],
    'Delivered': [],
    'Cancelled': [],
  };

  try {
    const { orderId } = req.params;

    console.log(req.params)

    console.log(req.body)


    const { newStatus } = req.body;

    const order = await orderModel.findOne({ _id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.items[0].status;
    console.log(currentStatus)


    // if (!allowedTransitions[currentStatus].includes(newStatus)) {
    //   return res.status(400).json({ success: false, message: `Cannot change status from ${currentStatus} to ${newStatus}` });
    // }

    console.log(newStatus,currentStatus)

    if (newStatus === 'Cancelled') {
      for (let item of order.items) {
        await productModel.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
        console.log("productModel.updated stock with item.quantity" ,item.quantity  ) 

      }
    }

    await orderModel.updateOne(
      { _id: orderId },
      { $set: { 'items.$[].status': newStatus , orderStatus : newStatus} }
    );

    console.log("orderModel.items.$[].status newStatus " , newStatus) 

    const updatedOrder = await orderModel.findOne({ _id: orderId });

    console.log("updatedOrder is " , updatedOrder) 


    res.status(200).json({ success: true, message: 'Order status updated successfully', status: updatedOrder.items[0].status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
};

const getOrderDetails =  async (req, res, next) => {
  try {

      const orderId = req.params.id
      console.log("getOrderDetails" ,orderId)

      const orders = await orderModel.findOne({ _id : orderId}).populate('items.product')
      
      res.render('admin/order-details',{
          title: 'Order Details',
          order: orders,
      })
  }
  catch(error) {
        res.status(200).json({ success: true, status: newStatus.items[0].status });
      //next(error)
  }
};

const updateStatus = async (req, res, next) => {
  try {

    console.log("upodate status")

    const { orderId, productId, selectedStatus } = req.body;
    console.log(orderId, productId, selectedStatus  )

    const order = await orderModel.findById(orderId);
    const cancelProduct = order.items.find(item => item.product.toString() === productId)            

    let paymentMethod = order.paymentMethod;
    
    const orderStatus = order.orderStatus;

    let paymentstatus ="Pending"
    
    console.log("selectedStatus",selectedStatus)
    console.log("paymentMerthod",paymentMethod)

    if(paymentMethod == "Razorpay" )
      {
          if(selectedStatus == "Delivered" )
          {
              paymentstatus = "Success"
          }
      }

    console.log("paymentstatus",paymentstatus)
    const updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId, 'items.product': productId },
        { $set: { 'items.$.status': selectedStatus  ,'orderStatus': selectedStatus, 'paymentStatus' :paymentstatus } },
        
        { new: true }
    );

      if ( selectedStatus == 'Cancelled' || selectedStatus == 'Returned' ) {

          const orderItem = updatedOrder.items.find(item => item.product.toString() === productId);
          await productModel.findByIdAndUpdate(productId, { $inc: { stock: orderItem.quantity } });
          selectedStatus.disabled = true;
      }
      
      if (updatedOrder) {

          return res.json({ success: true, updatedOrder });
          
      } else {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }
      

  }
  catch(error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
      //next(error)
  }
};

const formatDateString  = (orderDate) => {
  console.log(orderDate)
      // Split the date string into day, month, and year components
    const parts = orderDate.split('-');
    const day = parseInt(parts[0], 10);    // Day (assuming dd format)
    const month = parseInt(parts[1], 10) - 1; // Month (assuming mm format, subtract 1 for zero-based months)
    const year = parseInt(parts[2], 10);   // Year (assuming yyyy format)

    // Create a new Date object using the parsed components
    const orderdte = new Date(year, month, day);
    //const orderDateMonth = orderdte.getMonth();
   // console.log(orderdte)

return orderdte
}

//sales report
const getSalesReport = async (req, res) => {
  console.log("i m in sales report")
  try {
      const { from, to, period, sortData, sortOrder } = req.query;
      const currentDate = new Date();
      let startDate, endDate;

          console.log("I'm in sales report from, to, period, sortData, sortOrder ",from, to, period, sortData, sortOrder )
      // Determine startDate and endDate based on period
      switch (period) {
          case 'Daily':
              startDate = new Date(currentDate);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(currentDate);
              endDate.setHours(23, 59, 59, 999);
              
              break;
          case 'Weekly':
              startDate = new Date(currentDate);
              startDate.setDate(currentDate.getDate() - 6); 
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(currentDate);
              endDate.setHours(23, 59, 59, 999);
              break;
          case 'Monthly':
              startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
          case 'Yearly':
              startDate = new Date(currentDate.getFullYear(), 0, 1);
              endDate = new Date(currentDate.getFullYear(), 11, 31);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
          default:
              startDate = new Date(1970, 0, 1); // Default start date if none is provided
              endDate = new Date();
              break;
      }

      const conditions = {
          orderStatus: 'Delivered' // Add this condition to filter only 'delivered' orders
      };
      
      if (from && to) {
          conditions.orderDate = {
              $gte: new Date(from),
              $lte: new Date(to)
          };
      } else if (from) {
          conditions.orderDate = {
              $gte: new Date(from)
          };
      } else if (to) {
          conditions.orderDate = {
              $lte: new Date(to)
          };
      } else if (startDate && endDate) {
          conditions.orderDate = {
              $gte: startDate,
              $lte: endDate
          };
      }

     
      const sort = {};
      if (sortData) {
          sort[sortData] = sortOrder === "Ascending" ? 1 : -1;
      } else {
          sort['orderDate'] = sortOrder === "Ascending" ? 1 : -1;
      }

      // console.log(conditions)
      // console.log(sort)

      const orders = await orderModel.find(conditions).sort(sort);

      // console.log("Delivered Orders" ,orders)

      const overallSalesCount = orders.length;
      // console.log(overallSalesCount)

      let overallOrderAmount = 0;
      let overallDiscountAmount = 0;
      let overallProductCount = 0;
      let currentMonthEarning = 0.0;
      let productObj ={}
      let  prodCount = 0
      for (const order of orders) {
          overallOrderAmount += order.totalprice;
          overallDiscountAmount += order.discountAmount || 0;

          const currDate  = new Date()
          const orderDate =  formatDateString(order.orderDate)

          if( orderDate.getMonth() === currDate.getMonth()  && orderDate.getFullYear() ===currDate.getFullYear() )
          {
            currentMonthEarning += order.totalprice || 0.00
          }
         
          for (const item of order.items) {
            // console.log("i m in orders items" )
            // console.log(productObj)
            // console.log("item.product",item.product)

            if (productObj[item.product]) {
                productObj[item.product]++;
            } else {
                productObj[item.product] = 1;
            }
          }

        }
        // console.log('productObj:', productObj);
        // console.log('overallProductCount:', Object.keys(productObj).length);

      overallProductCount = Object.keys(productObj).length

      // console.log("overallOrderAmount",overallOrderAmount)
      // console.log("overallDiscountAmount",overallDiscountAmount)
      // console.log("overallProductCount",overallProductCount)
      // console.log("overallSalesCount" ,overallSalesCount)
      // console.log("currentMonthEarning" ,currentMonthEarning)

      let page = Number(req.query.page);
      if (isNaN(page) || page < 1) {
          page = 1;
      }

      const orderCount = await orderModel.countDocuments(conditions);
      const limit =  paginationHelper.SALES_PER_PAGE;

      const filteredOrders = await orderModel.find(conditions)
          .sort(sort)
          .skip((page - 1) * paginationHelper.SALES_PER_PAGE)
          .limit(limit);

      res.render('admin/sales-report', {
          admin: true,
          moment,
          shortDateFormat: 'DD-MM-YYYY', 
          orders: filteredOrders,
          from: from,
          to: to,
          period: period,
          currentPage: page,
          hasNextPage: page * paginationHelper.SALES_PER_PAGE < orderCount,
          hasPrevPage: page > 1,
          nextPage: page + 1,
          prevPage: page - 1,
          lastPage: Math.ceil(orderCount / paginationHelper.SALES_PER_PAGE),
          sortData: sortData,
          sortOrder: sortOrder,
          overallSalesCount: overallSalesCount || 0,
          overallOrderAmount: overallOrderAmount || 0.00,
          overallDiscountAmount: overallDiscountAmount || 0.0,
          overallProductCount: overallProductCount || 0.0,
          currentMonthEarning: currentMonthEarning || 0.0
      });

  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};

module.exports={
  loadlogin,
  loadAdminDashboard,
  backtodashboard,
  loadproductlist,
  getAdminOrderList,
  orderDetails,
  changeOrderStatus,
  getOrderDetails,
  updateStatus,
  logoutAdmin,
  getSalesReport
  
}