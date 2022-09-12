require("dotenv").config()
const express = require("express");
const bodyParser =require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")

const app = express();



app.use(express.static("public"));//to use public folder
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');

mongoose.connect("mongodb://localhost:27017/userDB");


const userDataSchema = new mongoose.Schema({
  email:String,
  password:String
});


userDataSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedField:["password"]});//imp add plugin to schema before mongoose model
//it is to encrypt the data;

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
    password:req.body.password
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
  const password = req.body.password;
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
