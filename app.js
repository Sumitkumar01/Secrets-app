require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();



app.use(express.static("public")); //to use public folder
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');

//step 1
app.use(session({ //session will use above the mongooseConnection
  secret: "this_is_a_secret.",
  resave: false,
  saveUninitialized: false
}));
// step2
app.use(passport.initialize()); //it is use to initialize passport and  start using(passport) it to authentication.
app.use(passport.session()); //it's use to tell the app to use passport to setup session& menage

mongoose.connect("mongodb://localhost:27017/userDB");


const userDataSchema = new mongoose.Schema({
  email: String,
  password: String
});
// step3
userDataSchema.plugin(passportLocalMongoose); //here we hase&salt passport & save to mongoose & it is after the schema

const User = mongoose.model("User", userDataSchema);

//passport-local config start & it will be just below the model.//it's a local Strategy
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser()); //it is use to create cookies.
passport.deserializeUser(User.deserializeUser()); //it is use to destroy cookies.

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req, res) {
  res.render("register");
});


app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});


app.get("/logout",function(req,res){
  req.logout(function(err) {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
});


app.post("/register", function(req, res) {
  User.register({username:req.body.username},req.body.password,function(err,user){//its come from passportLocalMongoose package
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      })
    }
  })
});


app.post("/login", function(req, res) {

  const user = new User({
    username:req.body.username,
    password:req.body.password
  })

  req.login(user,function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});






app.listen(3000, function() {
  console.log("Server is started.");
});
