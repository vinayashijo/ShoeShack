const orderModel = require("../../model/orderModel");

const getSalesReport = async (req, res) => {
  try {
    const { from, to, period, sortData, sortOrder, exportType } = req.query;
    const currentDate = new Date();
    let startDate, endDate;
    let  pieChartData,salesData;

    //console.log("period" ,period)

    if (period) {
      switch (period) {
        case "custom":
        // startDate = moment(currentDate).startOf('day').toDate();
        // endDate = moment(currentDate).endOf('day').toDate();
        
        case "daily":
          startDate = moment(currentDate).startOf("day").toDate();
          endDate = moment(currentDate).endOf("day").toDate();
          break;
        case "weekly":
          startDate = moment(currentDate)
            .subtract(6, "days")
            .startOf("day")
            .toDate();
          endDate = moment(currentDate).endOf("day").toDate();
          break;
        case "monthly":
          startDate = moment(currentDate).startOf("month").toDate();
          endDate = moment(currentDate).endOf("month").toDate();
          break;
        case "yearly":
          startDate = moment(currentDate).startOf("year").toDate();
          endDate = moment(currentDate).endOf("year").toDate();
          break;
        default:
          startDate = new Date(1970, 0, 1);
          endDate = new Date();
          break;
      }
    } 
    else 
    {
      startDate = moment(currentDate).startOf("year").toDate();
      endDate = moment(currentDate).endOf("year").toDate();

      req.session.admin = admin;

    //   let sales = await orderModel.find({ orderStatus : "Delivered",$ne : { paymentStatus :"Failed" }  });

       // get total sales for every month of the year vv//11/7/24
       const lastyearvalue =new Date(new Date().setFullYear(new Date().getFullYear() - 1) )

       const lastYearOrders = await orderModel.aggregate([
          {
              $match: {
                  orderDate: {
                      $gte: lastyearvalue,
                      $lt: new Date()
                  },
                  orderStatus: { $eq: 'Delivered' } // Only Delivered i m consdering as Sales
              }
          },
          {
              $group: {
                  _id: { $month: '$orderDate' },
                  totalSales: { $sum: '$totalprice' }
              }
          }
      ]);

      // Prepare data for bar chart special style vv {month : ,totalSales : }
      const months = moment.months(); // Array of month names
      salesData = months.map((month, index) => {
          const monthIndex = index + 1;
          const sales = lastYearOrders.find(item => item._id === monthIndex);
          return {
              month: month,
              totalSales: sales ? sales.totalSales : 0
          };
      });

      // Fetch sales by payment method for pie chart special style 
      const salesByPaymentMethod = await orderModel.aggregate([
          {
              $group: {
                  _id: '$paymentMethod',
                  totalSales: { $sum: '$totalprice' }
              }
          }
      ]);

      // Prepare data for pie chart {paymentMethod : ,totalSales : }
      const pieChartData = salesByPaymentMethod.map(item => ({
          paymentMethod: item._id,
          totalSales: item.totalSales
      }));
      
    }

    const conditions = {
      orderStatus: "Delivered",
    };

    if (from && to) {
      conditions.orderDate = {
        $gte: moment(from, "YYYY-MM-DD").toDate(),
        $lte: moment(to, "YYYY-MM-DD").toDate(),
      };
    } else if (from) {
      conditions.orderDate = {
        $gte: moment(from, "YYYY-MM-DD").toDate(),
      };
    } else if (to) {
      conditions.orderDate = {
        $lte: moment(to, "YYYY-MM-DD").toDate(),
      };
    } else if (startDate && endDate) {
      conditions.orderDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const sort = {};
    if (sortData) {
      sort[sortData] = sortOrder === "Ascending" ? 1 : -1;
    } else {
      sort["orderDate"] = sortOrder === "Ascending" ? 1 : -1;
    }

    const orders = await orderModel.find(conditions).sort(sort);

    if (exportType === "excel") {
      return generateExcelReport(orders, res);
    } else if (exportType === "pdf") {
      return generatePdfReport(orders, res);
    }
    // console.log("overallSalesCount", orders.length);

    const overallSalesCount = orders.length;
    let overallOrderAmount = 0;
    let overallDiscountAmount = 0;
    let productObj = {};

    for (const order of orders) {
      overallOrderAmount += order.totalPrice;
      overallDiscountAmount += order.discountAmount || 0;
      // console.log("order.items", order.items);

      for (const item of order.items) {
        console.log("i m in orders items");

        if (productObj[item.productId]) {
          productObj[item.productId]++;
        } else {
          productObj[item.productId] = 1;
        }

        // console.log("order.items", productObj);
        // console.log("order.items", productObj[item.productId]);
      }
    }

    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    const orderCount = await orderModel.countDocuments(conditions);

    // console.log("orderCount",orderCount)

    const limit =
      req.query.seeAll === "seeAll"
        ? orderCount
        : paginationHelper.SALES_PER_PAGE;

    const filteredOrders = await orderModel
      .find(conditions)
      .sort(sort)
      .skip((page - 1) * paginationHelper.SALES_PER_PAGE)
      .limit(limit);

    // console.log("order.items", productObj);

    if (period) {
      res.render("admin/sale-report", {
        admin: true,
        moment,
        shortDateFormat: "DD-MM-YYYY",
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
        overallSalesCount: overallSalesCount,
        overallOrderAmount: overallOrderAmount,
        overallDiscountAmount: overallDiscountAmount,
        overallProductCount: Object.keys(productObj).length
      
      });
    } 
    else {

        res.render("admin/admin-dashboard", { admin: admin ,
            moment,shortDateFormat: "DD-MM-YYYY",
            orders: filteredOrders,
            salesData,pieChartData,
            overallSalesCount: overallSalesCount,
            overallOrderAmount: overallOrderAmount,
            overallDiscountAmount: overallDiscountAmount,
            overallProductCount: Object.keys(productObj).length}),
            salesData ,
            pieChartData 
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const generateExcelReport = (orders, res) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 15 },
    { header: "Billing Name", key: "billingName", width: 25 },
    { header: "Date", key: "date", width: 20 },
    { header: "Total", key: "total", width: 15 },
    { header: "Payment Status", key: "paymentStatus", width: 20 },
    { header: "Payment Method", key: "paymentMethod", width: 20 },
  ];

  orders.forEach((order) => {
    worksheet.addRow({
      orderId: order.trackingId,
      billingName: order.userId.name,
      date: moment(order.orderDate).format("DD-MM-YYYY"),
      total: `₹${order.totalPrice.toFixed(2)}`,
      paymentStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales_report.xlsx"
  );

  return workbook.xlsx
    .write(res)
    .then(() => {
      res.status(200).end();
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Could not generate Excel report");
    });
};

const generatePdfReport = (orders, res) => {
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");

  doc.pipe(res);

  doc.fontSize(20).text("Sales Report", { align: "center" });

  orders.forEach((order) => {
    doc
      .fontSize(12)
      .text(`Order ID: ${order.trackingId}`, { continued: true })
      .text(` | Billing Name: ${order.userId.name}`, { continued: true })
      .text(` | Date: ${moment(order.orderDate).format("DD-MM-YYYY")}`, {
        continued: true,
      })
      .text(` | Total: ₹${order.totalPrice.toFixed(2)}`, { continued: true })
      .text(` | Payment Status: ${order.orderStatus}`, { continued: true })
      .text(` | Payment Method: ${order.paymentMethod}`);
  });

  doc.end();
};

module.exports = { getSalesReport, generatePdfReport, generateExcelReport };
