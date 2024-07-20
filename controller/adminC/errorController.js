
const load500 = function(req, res) {

    res.render('error/500', { error:  });
  };


  app.use((err, req, res, next) => {
    console.error(err.stack);
        res.status(500).render('500');
});

  module.exports  = {load500,load400} 