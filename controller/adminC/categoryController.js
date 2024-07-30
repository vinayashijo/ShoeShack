
const categoryModel=require('../../model/categoryModel')
const pageHelper=require('../../helper/paginationHelper')

//category list page----------------------------------------------------------------
const loadcategorylist = async function(req, res) {
  try {

      const data = await categoryModel.find()
      const {error}=req.flash() 
      const {message}=req.flash()
      let {page} = req.query

       if(!page)
       {
        page= 1
       }
      
      const ITEMS_PER_PAGE = pageHelper.CATEGORY_PER_PAGE
      const categoryTotalCount = await  categoryModel.find().count()
      console.log("categorycount,itemsperpage",categoryTotalCount,ITEMS_PER_PAGE)

      res.render('admin/category-list', { data: data, error:error, message:message,
        currentPage : page,
        hasNextPage : categoryTotalCount  >  page * ITEMS_PER_PAGE,
        hasPrevPage : page > 1,
        nextPage : page + 1,
        prevPage :page --,
        lastPage : Math.ceil(categoryTotalCount/ ITEMS_PER_PAGE),
      });

  } catch (error) {
      console.error("Error fetching category data:", error);
      res.status(500).send("Internal Server Error");
  } 

};

//addtocategory page---------------------------------------------------------------------
const loadaddToCategory = async(req,res)=>{
  try {
      const name = req.body.categoryName;
      const description = req.body.description
      const offer  = req.body.offer
       const categoryExist = await categoryModel.findOne({name:name})
       
       if (!categoryExist) {
            const categoryadded = {
              name:name,
              description:description,
              offer: offer,
              islisted:true
            }   
            
           const id = await categoryModel.create(categoryadded)
           console.log("Category added successfully", id)

          //  if (offer && offer > 0 )
          //  {
          //       const offerCatproducts = await ProductModel.find({category : id})
          //       const regularPrice = offerCatproducts.regularPrice
          //       const oldPrice = offerCatproducts.oldPrice
          //       const discount = offerCatproducts.discount

                // if(offerCatproducts)
                // {
                //   offerCatproducts.array.forEach(element => 
                //     {
                //     const cDiscount  =  offer
                //     const pDiscount  =  element.discount
                //     if(cDiscount > pDiscount )
                //     {
                //           oldPrice =   oldPrice - (cDiscount * .01)
                //     }

                //   });
                // }
          //  }
            res.redirect("/categorylist");
          
       }else{
        req.flash("error", "Category with the same name already exists");
        res.redirect("/categorylist") 
       }
    
  } catch (error) {
    console.log(error.message)
  }
}

//list&unlist function-----------------------------------------------------
const loadunlistorlist = async (req, res) => {
  try {
      // console.log("req for list or unlist");
      const id = req.query.id;
      // console.log("/////" + id);
      const category = await categoryModel.findById(id);
      // console.log(category);

      if (category.islisted === true) {
          await categoryModel.findByIdAndUpdate(id, {
              islisted: false
          });
          res.json({success:true,flag:0})
      }else{
        await categoryModel.findByIdAndUpdate(id, {
          islisted: true
        
      });
      res.json({success:true,flag:1})
      }   
  } catch (error) {
      console.log(error.message);
      res.json({ success: false, message: error.message }); 
  }
};

//edit category page------------------------------------------------
const loadeditcategorypage=async function(req, res) {
  try {
    const id=req.query.id;
      const data = await categoryModel.find({_id:id})
 
      const {error}=req.flash()
      res.render('admin/category-edit', { data: data ,error:error});
  } catch (error) {
      console.error("Error fetching category data:", error);
      res.status(500).send("Internal Server Error");
  }
};

//update category function-----------------------------------------------------------
const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { categoryName,description, offer } = req.body;

    console.log("i m in category update")
    console.log(categoryName,description, offer,req.body )
    
    const existingCategory = await categoryModel.findOne({ name: categoryName });

    if (!existingCategory||existingCategory._id.toString() === id) {

      await categoryModel.findByIdAndUpdate(id, {
        name: categoryName,
        description: description,
        offer: offer
      });
      console.log("Category updated successfully")
      req.flash("message", "Category updated successfully");
      res.redirect("/categorylist");
    } else {
      req.flash("error", "Category with the same name already exists");
      res.redirect(`/editcategory?id=${id}`);
    }
  } catch (error) {
    req.flash("message", "Error updating category");
    res.redirect("/categorylist");
  }
};

module.exports={
  loadaddToCategory,
  loadcategorylist,
  loadunlistorlist,
  loadeditcategorypage,
  updateCategory
 
}