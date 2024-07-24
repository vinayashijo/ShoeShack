const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");

const doSignUp = (userData, verify, emailVerify) => {
  return new Promise(async (resolve, reject) => {
    const userExist = await userModel.findOne({
      $or: [{ email: userData.email }, { mobile: userData.mobile }],
    });

    if (emailVerify === userData.email) {
      if (!userExist) {
        if (userData.password === userData.confirmPassword) {
          if (verify) { // OTP verification
            try {
              const password = await bcrypt.hash(userData.password, 10);
              // const ownReferralCode = generateReferralCode();

              const ownReferralCode = await module.exports.generateReferralCode();

              // console.log(ownReferralCode)
              // console.log(password)

              let isreferred = false;
              let walletBalance = 0;
              let referredBy;

              if (userData.referal) {
                const referredCode = userData.referal;
                const referrer = await userModel.findOne({ referralCode: referredCode }); // Await the referrer query
                // console.log(referrer)
                if (referrer) {
                  isreferred = true;
                  referredBy = referrer._id;
                  let refererBalance = referrer.wallet + 1000;

                  await userModel.updateOne({ _id: referredBy }, { $set: { wallet: refererBalance } });

                  const referrerTransaction = {
                    amount: 1000,
                    date: new Date(),
                    message: 'Referral Bonus'
                  };

                  referrer.walletHistory.push(referrerTransaction);
                  await referrer.save();

                  walletBalance = 500; // It's for user registered
                }
              }

              const userd = {
                name: userData.username,
                email: userData.email,
                mobile: userData.mobile,
                password: password,
                referralCode: ownReferralCode,
                wallet: walletBalance,
                isVerified: true,
              };
              // console.log(userd)

              if (userData.referal)
                 {
                // console.log(userData.referal)
                userd.referredBy = referredBy;
                userd.isreferred = true;

                const referredTransaction = {
                  amount: 500,
                  date: new Date(),
                  message: 'Referral Bonus by Referer'
                };

                userd.walletHistory.push(referredTransaction);
                //await referrer.save();

              }
              // console.log(userData)

              await userModel
                .create(userd)
                .then((data) => {
                  const response = { status: true, message: "Signed Up Successfully" };
                  resolve(response);
                })
                .catch((error) => {
                  console.log(error)
                  reject(error);
                });

                console.log("user added successfully")

            } catch (error) {
              reject(error);
            }
          } else {
            console.log("OTP doesn't match")

            const response = { status: false, message: "OTP doesn't match" };
        
            resolve(response);
          }
        } else {
          console.log("Password doesn't match")

          const response = { status: false, message: "Password doesn't match" };
          resolve(response);
        }
      } else {
        // console.log("User already exists")

        const response = { status: false, message: "User already exists" };
        resolve(response);
      }
    } else {
      const response = { status: false, message: "Email not matched" };
      resolve(response);
    }
  });
};

const generateReferralCode = async () => {
  try {
      
      const randomString = (length) => {
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let result = '';
          for (let i = 0; i < length; i++) {
              result += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          return result;
      };

      let referralCode;
      let referralCodeExists = true;
      while (referralCodeExists) {// referral code generate cheyyum until its find a unique code
          referralCode = randomString(6); 
          const existingUser = await userModel.findOne({ referralCode: referralCode });
          if (!existingUser) {
              referralCodeExists = false;
          }
      }
      return referralCode;
  } catch (error) {
      console.log(error);
      throw error;
  }
};



const postuserSignup = async (req, res) => {
  try {
      const {referal} = req.body;
     
      const userData = await userSchema.findOne({ email: req.body.email });

      if (userData) {
          req.flash('userExist', "User Already Exist..............");
          return res.redirect('/signup');
      }

      let walletBalance = 0;

  
     
      if (referal) {
          const referrer = await userSchema.findOne({ referralCode: referal });// finding the referrer bu using the referal code
          
          if (referrer) {
              
              let refererBalance = referrer.wallet + 1000;
              
              await userSchema.updateOne({ _id: referrer._id }, { $set: { wallet: refererBalance } });
              const referrerTransaction = {
                  amount: 1000,
                  date: new Date(),
                  message: 'Referal Bonus'
              };
              referrer.walletHistory.push(referrerTransaction);
              await referrer.save();
              walletBalance=1000;
          } else {
              
          }
      }  
      const referralCode = await module.exports.generateReferralCode();
      // console.log("refferalcode",referralCode)

      const otp = verificationController.sendMail(req.body.email);
      const password = await bcrypt.hash(req.body.password, 12);//password hashing

      // Create a new user with the generated referral code
      const user = new userModel({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          isAdmin: 0,
          mobile: req.body.mobile,
          password: password,
          token: {
              otp: otp,
              generatedTime: new Date()
          },
          referralCode: referralCode,
          wallet: walletBalance
      });



      // Add referral bonus transaction to referee's wallet history
  const refereeTransaction = {
      amount: walletBalance,
      date: new Date(),
      message: 'Referal Bonus'
  };
  user.walletHistory.push(refereeTransaction);

      await user.save();

   


      req.session.unVerifiedMail = req.body.email;
      res.redirect('/otp-verification');
  } catch (error) {
      console.log(error);
      res.redirect('/500'); // Redirect to an error page if there's an error
  }
};


module.exports = {
  doSignUp,generateReferralCode

}