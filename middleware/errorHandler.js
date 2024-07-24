// Custom error handling middleware
// const errorHandler = (err, req, res, next) => {
//     console.log("I m in error controller")

//     console.log(err.status)
//     if (err.status === 400) {
//         console.log("400 in eror Handler :" ,err.message)
//         res.status(400).render('error/400', { error: err.message }); // Render 400.ejs with error message
//     }
//     else if (err.status === 401) {
//             console.log("403 in eror Handler :" ,err.message)
//             res.status(401).render('error/401', { error: err.message }); // Render 401.ejs with error message
//     } else if (err.status === 403) {
//         console.log("403 in eror Handler :" ,err.message)

//         res.status(403).render('error/403', { error: err.message }); // Render 403.ejs with error message
//     } else if (err.status === 404) {
//         console.log("404 in eror Handler :" ,err.message)

//         res.status(404).render('error/404', { error: err.message }); // Render 404.ejs with error message
//     } else {
//         console.log("500 in eror Handler :" ,err.message)
//         console.error('Error caught by custom middleware:', err);
//         res.status(500).render('error/500', { error: err.message }); // Render 500.ejs with error message
//     }
// };

module.exports = (err, req, res, next) => {

    console.error(err.stack);
  
    if (res.headersSent) 
    {
        // console.log("going to next in error handler")
        return next(err);
    }
    // console.log("err.status " ,err.status)

    if (err.status === 404) {
         console.log("err.status  ==404")
      return res.status(404).render('error/404', { error : err ,message: err.message });
    }
  
    if (err.status === 403) {
        console.log("err.status  ==403")
        return res.status(404).render('error/403', { error : err ,message: err.message });
        //pass err to the view page
    }

    if (err.status === 400) {
      return res.status(400).render('error/400', { error : err ,message: err.message });
    }
  
    res.status(500).render('error/500', { error : err ,message: 'Internal Server Error' });
      //pass err to the view page
  };

// module.exports = errorHandler;
