const userHelper = require("../../helper/userHelper");
const productModel = require("../../model/productModel");
const userModel = require("../../model/userModel");
const categoryModel = require("../../model/categoryModel");
const paginationHelper = require("../../helper/paginationHelper");
const cartModel = require("../../model/cartModel");
const orderModel = require("../../model/orderModel");
const wishlistModel = require("../../model/wishlistModel");

const bcrypt = require("bcrypt");

const moment = require("moment");

const indexpage = function (req, res) {
  console.log("index");
  //http://localhost:3000/indexpage
  res.render("user/index-4", {});
};

//login page rendering----------------------------------------------------------------
const loadlogin = function (req, res) {
  res.render("user/user-login", { errorMessage: req.flash("errorMessage") });
};

//register page rendering-------------------------------------------------------------
const loadregister = function (req, res) {
  res.render("user/user-register");
};

//home page or user dashboard---------------------------------------------------------
const loadhome = async function (req, res, next) {
  try {
    console.log("loadhome");
    if (req.session.user) {
      const userId = req.session.user._id; // Assuming req.session.user contains the user's ID
      const user = await userModel.findById(userId);

      if (!user.isActive) {
        req.session.user = null;

        res.redirect("/userlogin"); // User is not blocked, proceed to the next,else login page / u can show LOgin instead of LOgout
      }

       //cart notifications
      const cartlist = await cartModel.findOne({ userId: userId });
      let cartlistCount = 0;
      if (cartlist) {
        if (Array.isArray(cartlist.items)) {
          cartlistCount = cartlist.items.length;
        } else {
          console.error("cartlist.items is not an array");
        }
      }

      req.session.productCount = cartlistCount || 0;
      // console.log("productCount", req.session.productCount);

      //cart notifications

       //wishlist notifications
      const wishlist = await wishlistModel.findOne({ userId: userId });
      let wishlistCount = 0;
      if (wishlist) {
        if (Array.isArray(wishlist.items)) {
          //console.log("Wishlist items: ", wishlist.items);
          wishlistCount = wishlist.items.length;
        } else {
          console.error("wishlist.items is not an array");
        }
      }
      req.session.wishlistCount = wishlistCount || 0;
      // console.log("wishlistCount", req.session.wishlistCount);

      //wishlist notifications
    }

    const data = await productModel.find().populate("category");
    res.render("user/user-home", {
      data: data,
      user: req.session.user,
      wishlistCount: req.session.wishlistCount,
    });
  } catch (error) {
    console.log(error);
    next(error)
    // res.status(500).send("Internal server error");
  }
};

const getTopSoldProducts  = async () => {
  try {
        const topSoldProducts = await orderModel.aggregate([
          {
            $unwind: '$products'
          },
          {
            $group: {
              _id: '$products.productId',
              totalQuantity: { $sum: '$products.quantity' }
            }
          },
          {
            $sort: { totalQuantity: -1 }
          },
          {
            $limit: 5 
          }
        ]);
        // console.log("topSoldProducts" ,topSoldProducts)

        // Populate product details
        const populatedProducts  =  topSoldProducts.sort({ createdOn: -1 })
        .limit(4);
        // console.log(populatedProducts)
        // const populatedProducts = await productModel.populate(topSoldProducts, { path: '_id', select: 'name description price image' });

    return populatedProducts;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch top sold products');
  }
}

//create user function------------------------------------------------
const CreateUser = async (req, res) => {
  try {
    console.log("Request Entered to insertUser");
    console.log(req.body.confirmPassword);

    const response = await userHelper.doSignUp(
      req.body,
      req.session.otpmatched,
      req.session.userEmail
    );

    if (!response.status) {
      res.redirect("/usersignup");
    } else {
      res.redirect("/userlogin");
    }
  } catch (err) {}
};

//productdetailspage rendering-----------------------------------------------------------------------
const loadproductdetailspage = async function (req, res) {
  try {
    console.log("In productDetails ");
    const id = req.params.id;
    const data = await productModel.findOne({ _id: id }).populate("category");
    const doc = await productModel.find({ category: data.category });

    // const userId = req.session.user._id; // Assuming req.session.user contains the user's ID
    // const user = await userModel.findById(userId);
    // if (user) {
    //   if (!user.isActive) {
    //     req.session.user = null;
    //     res.redirect("/userlogin"); // User is not blocked, proceed to the next,else login page / u can show LOgin instead of LOgout
    //   }

    //   const cartlist = await cartModel.findOne({ userId: userId });
    //   if (cartlist) {
    //     req.session.productCount = cartlist.items.length || 0;
    //     console.log("cartCount", req.session.productCount);
    //   }

    //   const wishlist = await wishlistModel.find({ userId: userId });
    //   let wishlistCount = 0;
    //   if (wishlist) {
    //     req.session.wishlistCount = wishlist.items.length || 0;
    //     console.log("wishlistCount", req.session.wishlistCount);
    //   }
    // }

    res.render("user/user-productdetails", {
      data: data,
      user: req.session.user,
      doc: doc,
    });
  } catch (error) {
    console.log("Error in loading product details page:", error);
    res.status(500).send("Internal Server Error");
  }
};

//userlogin-----------------------------------------------------------------------------------------------
const loaduserlogin = async (req, res) => {
  try {
    console.log(req.body.email)
    const user = await userModel.findOne({ email: req.body.email });
    // console.log(user)
    
    if (!user) {
      req.flash("errorMessage", "User does not exist");
      res.redirect("/userlogin");
    } else if (bcrypt.compareSync(req.body.password, user.password)) {
      if (user.isActive === true) {
        req.session.user = user;

        // console.log(req.session.user)

        res.redirect("/");
      } else {
        req.flash("errorMessage", "User is Blocked");
        res.redirect("/userlogin");
      }
    } else {
      req.flash("errorMessage", "Incorrect password");
      res.redirect("/userlogin");
    }
  } catch (error) {
    console.log("Error in user login: " + error);
    res.status(500).send("Internal Server Error: " + error);
  }
};

const loadshop = async function (req, res) {
  try {
    console.log(" iN loadshop");
    if (req.session.user) {
      const userId = req.session.user._id; // Assuming req.session.user contains the user's ID
      const user = await userModel.findById(userId);

      if (!user.isActive) {
        console.log("!user.isActive", user.isActive);

        req.session.user = null;
        res.redirect("/userlogin"); // User is not blocked, proceed to the next,else login page / u can show LOgin instead of LOgout
      }
    }

    const { cat, search, sort, hideOutOfStock, page = 1 } = req.query;
    console.log("search", search);
    console.log("cat", cat);

    let pageNumber = Number(page);
    if (isNaN(pageNumber) || pageNumber < 1) {
      pageNumber = 1;
    }

    const condition = { isBlocked: false };
    if (cat && cat !== "All") {
      condition.category = cat;
    }

    if (search) {
      console.log(search);

      condition.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (hideOutOfStock === "true") {
      condition.stock = { $gt: 0 };
    }

    let sortCondition = {};
    switch (sort) {
      case "price_aA_to_zZ":
        sortCondition = { regularPrice: 1 };
        break;
      case "price_Aa_to_Zz":
        sortCondition = { regularPrice: -1 };
        break;
      case "name_aA_to_zZ":
        sortCondition = { productName: 1 };
        break;
      case "name_Aa_to_Zz":
        sortCondition = { productName: -1 };
        break;
      case "popularity":
        sortCondition = { popularity: -1 };
        break;
      default:
        break;
    }

    const productCount = await productModel.find(condition).count();
    const data = await productModel
      .find(condition)
      .populate("category")
      .sort(sortCondition)
      .skip((pageNumber - 1) * paginationHelper.ITEMS_PER_PAGE)
      .limit(paginationHelper.ITEMS_PER_PAGE);

    const newproducts = await productModel
      .find({})
      .populate("category")
      .sort({ createdOn: -1 })
      .limit(4);

    //const popularData = data.limit(2)

        // console.log(popularData)

    
    const newfilteredProducts = newproducts.filter(
      (product) => product.category
    );

    const categories = await categoryModel.find({ islisted: true });

    if (!data || !categories) {
      return res.status(404).send("Data not found");
    }

    const startingNo = (pageNumber - 1) * paginationHelper.ITEMS_PER_PAGE + 1;
    const endingNo = Math.min(startingNo + paginationHelper.ITEMS_PER_PAGE);

    const cartCount = await cartModel.countDocuments({});

    //notification cart count
    req.session.productCount = cartCount;

    console.log("req.session.productCount", req.session.productCount);

    res.render("user/index-4", {
      data,
     
      newproducts: newfilteredProducts,
      categories,
      totalCount: productCount,
      currentPage: pageNumber,
      hasNextPage: pageNumber * paginationHelper.ITEMS_PER_PAGE < productCount,
      hasPrevPage: pageNumber > 1,
      nextPage: pageNumber + 1,
      prevPage: pageNumber - 1,
      lastPage: Math.ceil(productCount / paginationHelper.ITEMS_PER_PAGE || 1),
      startingNo,
      endingNo,
      cat,
      search,
      sort,
      hideOutOfStock,
      userId: req.session.user?._id,
    });
  } catch (error) {
    console.error("Error in loadshop controller:", error);
    res.status(500).send("Internal server error");
  }
};

//shop page - FILTERS
//profile page render---------------------------------------------------------------------

const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.session.user._id });

    //  wallet history sorting done in descending order by date //vv
    if (user.walletHistory && user.walletHistory.length > 0) {
      user.walletHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    //users
      let { sortData,sortOrder } = req.query;
      const { search = '' } = req.query;
      const limit = 5;

      let page = Number(req.query.page);
      if (isNaN(page) || page < 1) {                                  
          page = 1;
      }

      if(!sortData)
      {  
        sortData = "orderDate"
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
      console.log(sortData,sortOrder)
      console.log(sort[sortData])
      
      const usersCount = await orderModel.find().count();
      console.log("usersCount" ,usersCount);

      const userOrders = await orderModel
      .find({ userId: req.session.user._id })
      .sort(sort)
      .skip((page - 1) * paginationHelper.ORDER_PER_PAGE)
      .limit(paginationHelper.ORDER_PER_PAGE)

    res.render("user/user-profile", {
      user: user,
      userorders: userOrders,
      moment,
      currentPage : page,
      hasNextPage : usersCount  >  page * paginationHelper.ORDER_PER_PAGE,
      hasPrevPage : page > 1,
      nextPage : page + 1,
      prevPage: page - 1,
      lastPage : Math.ceil(usersCount/ paginationHelper.ORDER_PER_PAGE),
      search : search,
      sortData: sortData,
      sortOrder: sortOrder
    });
  } catch (error) {
    console.log("controller error", error);
    res.status(500).send("Internal Server Error");
  }
};

const depositWallet = async (req, res) => {
  try {
    console.log("I m in depositWallet ");
    const amount = parseFloat(req.body.amt);
    const razorpay_payment_id = req.body.razorpay_payment_id;

    const userId = req.session.user._id;

    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid deposit amount" });
    }

    const now = moment().toISOString();
    console.log(amount, new Date());

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newWalletBalance = user.wallet + amount;
    const newWalletHistoryEntry = {
      date: new Date(),
      amount: amount,
      message: "Deposit",
    };

    console.log(newWalletBalance, newWalletHistoryEntry);

    await userModel.updateOne(
      { _id: req.session.user._id },
      {
        $set: { wallet: newWalletBalance },
        $push: { walletHistory: newWalletHistoryEntry },
      }
    );

    console.log("done");
    // res.redirect('getprofile');

    res
      .status(200)
      .json({
        success: true,
        newBalance: newWalletBalance,
        message: "Successfully Deposited",
      });
  } catch (error) {
    console.error("Error in depositing to  Wallet:", error);
    res
      .status(404)
      .json({
        success: false,
        message: "Error in Deposit Wallet Controller!",
        error,
      });
    // res.redirect('/500')
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, npassword, cpassword } = req.body;

    // Validate the new password and confirm password
    if (npassword !== cpassword) {
      return res
        .status(400)
        .json({ success: false, message: "New passwords do not match" });
    }

    console.log(password, npassword, cpassword);

    const user = await userModel.findOne({ _id: req.session.user._id });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    console.log(password, user.password);

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password entered is wrong" });
    }

    const newHashedPassword = await bcrypt.hash(npassword, 10);

    await userModel.updateOne(
      { _id: req.session.user._id },
      { $set: { password: newHashedPassword } }
    );

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error updating password" });
  }
};

async function verifyPassword(enteredPassword, storedHashedPassword) {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, storedHashedPassword);
    return isMatch;
  } catch (err) {
    console.error("Some issues here: verifyPassword", err);
    throw new Error("Error verifying password");
  }
}

// async function verifyPassword(enteredPassword, storedHashedPassword) {
//   try

//   {  const isMatch = await bcrypt.compare(enteredPassword, storedHashedPassword);

//     return isMatch;
//   }
//   catch(err)
//   {
//     console.log("Some issues here :verifyPassword")
//     return res.status(500).json({ success: false, message: "issues at verifyPassword" });
//   }
// }

// const resetPassword = async (req, res) => {
//   try {
//           const { password, npassword,cpassword } = req.body;

//           console.log( password,npassword,cpassword )
//           const user=await userModel.findOne({_id:req.session.user._id})

//           const enteredPassword = password;//'userPassword123';
//           const storedHashedPassword = user.password  //'$2b$10$somethinghashed';
//           console.log(enteredPassword,storedHashedPassword);

//           await bcrypt.compare(enteredPassword, storedHashedPassword).then(isMatch => {

//               if (isMatch) {
//                   console.log('Password is correct');
//                   // Proceed with login
//               }
//               else
//               {
//                 console.log("Existing password is wrong")
//                 return res.status(500).json({ success: false, message: 'Current password entered is wrong' });
//               }
//           });

//           const newpassword = await bcrypt.hash(npassword, 10);

//           await userModel.updateOne({ _id: req.session.user._id }, {
//           $set: {
//             password: newpassword, // Ensure that you're updating the password to the new password
//           }
//         });
//         res.status(200).json({ success: true, message: 'Password updated successfully' });
//   }
//   catch (error) {
//        res.status(500).json({ success: false, message: 'Error updating password' });
//   }
// };

const saveProfile = async (req, res) => {
  try {
    await userModel.updateOne(
      { _id: req.session.user._id },
      {
        $set: {
          name: req.body.name,
          // lastName : req.body.lastName,
          mobile: req.body.mobile,
          // email : req.body.email
        },
      }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.redirect("/500");
  }
};

// ---Address-----------------------------------
const getAdd_Address = (req, res) => {
  // const isMaster  =  req.params.isM ? 1 : 0

  console.log("AddAddress");
  // res.render(`user/add-address/${isMaster}`)

  res.render("user/add-address");
};

const getAddress = async (req, res) => {
  try {
    console.log("getAddress body:", req.body);
    const user = await userModel.find({ _id: req.session.user._id });

    res.render("user/shop-checkout", {
      user: user[0],
      address: user[0].address,
    });
  } catch (error) {
    // res.redirect('/500')
    res.status(500).send("Internal Server Error");
  }
};

const addAddress = async (req, res) => {
  try {
    // console.log('Request body:', req.body); // Log the request body to debug
    // console.log('Session user ID:', req.session.user ? req.session.user._id : 'No session user'); // Log session user ID

    // if (!req.session.user) {
    //   res.status(401).send('Unauthorized: No session user');
    //   return;
    // }

    const address = {
      name: req.body.name,
      mobile: req.body.mobile,
      pincode: req.body.pincode,
      houseName: req.body.houseName,
      cityOrTown: req.body.cityOrTown,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
    };

    const result = await userModel.updateOne(
      { _id: req.session.user._id },
      { $push: { address: address } }
    );

    // console.log('Address update result:', result);
    res.redirect("/getprofile?tab=address"); //redirect to the profile page after succes removal
    // res.redirect('/getprofile');
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).send("Add Address - Internal Server Error");
  }
};

const orderaddAddress = async (req, res) => {
  try {
    // console.log('Request body:', req.body); // Log the request body to debug
    // console.log('Session user ID:', req.session.user ? req.session.user._id : 'No session user'); // Log session user ID

    if (!req.session.user) {
      res.status(401).send("Unauthorized: No session user");
      return;
    }

    const address = {
      name: req.body.name,
      mobile: req.body.mobile,
      pincode: req.body.pincode,
      houseName: req.body.houseName,
      cityOrTown: req.body.cityOrTown,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
    };

    const result = await userModel.updateOne(
      { _id: req.session.user._id },
      { $push: { address: address } }
    );

    console.log("Address update result:", result);
    res.redirect("/checkout"); //redirect to the profile page after succes removal
    // res.redirect('/getprofile');
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).send("Add Address - Internal Server Error");
  }
};

const getEditAddress = async (req, res) => {
  try {
    console.log("getEditAddress");
    const addressId = req.params.id;
    const userId = req.session.user._id;
    console.log(addressId);
    // console.log(userId)
    // const address=await addressSchema.findOne({_id:addressId})

    const user = await userModel.findOne({ _id: userId });
    const address = user?.address.filter((x) => x._id == addressId);
    // console.log(user)
    console.log(address);
    res.render("user/edit-address", { address: address[0] });
  } catch (error) {
    // res.redirect('/500')
    res.status(500).send("Internal Server Error");
  }
};

const editAddress = async (req, res) => {
  // console.log("save editAddress");
  const addressId = req.params.id;
  const userId = req.session.user._id;
  console.log(addressId, userId);

  try {
    const {
      name,
      mobile,
      pincode,
      houseName,
      cityOrTown,
      district,
      state,
      country,
    } = req.body;
    console.log(
      name,
      mobile,
      pincode,
      houseName,
      cityOrTown,
      district,
      state,
      country
    );

    const user = await userModel.findOneAndUpdate(
      { _id: userId, "address._id": addressId },
      {
        $set: {
          "address.$.name": name,
          "address.$.mobile": mobile,
          "address.$.pincode": pincode,
          "address.$.houseName": houseName,
          "address.$.cityOrTown": cityOrTown,
          "address.$.district": district,
          "address.$.state": state,
          "address.$.country": country,
        },
      },
      { new: true } //its good to get the updated doc right after the update itself vv
    );

    console.log("Saved");

    if (!user) {
      return res.status(404).send("User or address not found");
    }

    // Redirect after successful update
    // return res.redirect('/getprofile');

    return res.redirect("/getprofile?tab=address");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

const removeAddress = async (req, res) => {
  try {
    const addressId = req.params.id; // The ID of the address to be removed
    const userId = req.session.user._id; // The ID of the user
    console.log(addressId);
    // Find the user and remove the address with the specified ID
    const user = await userModel.findByIdAndUpdate(
      { _id: userId },
      {
        $pull: { address: { _id: addressId } }, // Remove the address with the specified _id
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).send("Address not found");
    }

    res.redirect("/getprofile?tab=address"); //redirect to the profile page after succes removal
    // res.redirect('/getprofile');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//user logout -----------------------------------------------------------------------------
const logoutUser = (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/userlogin");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadlogin,
  loadregister,
  loadhome,
  CreateUser,
  loadproductdetailspage,
  loaduserlogin,
  loadshop,
  logoutUser,
  getUserProfile,
  saveProfile,
  resetPassword,
  getAdd_Address,
  getAddress,
  addAddress,
  removeAddress,
  getEditAddress,
  editAddress,
  indexpage,
  orderaddAddress,
  depositWallet,
  getTopSoldProducts
};
