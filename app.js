require("dotenv").config()
const express = require("express");
const bodyParser =require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();



app.use(express.static("public"));//to use public folder
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');

mongoose.connect("mongodb://localhost:27017/userDB");


const userDataSchema = new mongoose.Schema({
  email:String,
  password:String
});



const User = mongoose.model("User", userDataSchema);


app.get("/",function(req,res){
  res.render("home");
});

app.get("/register",function(req,res){
  res.render("register");
});


app.get("/login",function(req,res){
  res.render("login");
});


app.post("/register", function(req,res){
  const newUser = new User ({
    email:req.body.username,
    password:md5(req.body.password)
  });
  newUser.save(function(err){//use to save the userData to database.
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
});

app.post("/login",function(req,res){
  const username = req.body.username;
  const password = md5(req.body.password);
//here we check email & password  of user.
  User.findOne({email: username},function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });
});





app.listen(3000,function(){
  console.log("Server is started.");
});
