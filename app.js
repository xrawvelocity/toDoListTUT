//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const _ = require('lodash')

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-victor:NmppcXYi6p0fsCRc@cluster0-1fmqg.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true,
useFindAndModify: false})

const itemsSchema = {
  name:String
}

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({name:"Welcome to your todolist"})

const item2 = new Item({name:"Hit the + button to add a new item."})

const item3 = new Item({name:"<-- Hit this to delete an item."})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {

  Item.find({}, (err, foundItems)=>{
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, err => {
        if(err) {
          console.log(err)
        } else {
          console.log("Successfully saved deafult items to DB")
        }
      });
      res.redirect("/")
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems})
    }
  })

  

});

app.post("/", async (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({name:itemName})

  if(listName === "Today"){
    await newItem.save()  
    res.redirect('/')
  } else {
    List.findOne({name: listName}, async (err,foundList)=>{
      foundList.items.push(newItem)
      await foundList.save();
      res.redirect("/" + listName)
    })
  }
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName)

  console.log(req.params.customListName)

  List.findOne({name:customListName}, (err,foundList)=>{
    if (!err){
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        })
      
        list.save();
        res.redirect("/" + customListName)
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })
  

});

app.post('/delete', (req,res)=>{
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  if(listName === "Today") {
    Item.deleteOne({_id: checkedItemId}, (err,response)=>{
      err ? console.log(err) :
      res.redirect('/');
      console.log("Successfully removed item");
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull : {items: {_id: checkedItemId}}}, (err,response)=>{
      err ? console.log(err) :
      res.redirect('/' + listName);
      console.log("Successfully removed item");
    })
  }
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
