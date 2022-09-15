require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook");


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
  password: String,
  googleId:String,
  facebookId:String,
  secret:String
});
// step3
userDataSchema.plugin(passportLocalMongoose); //here we hase&salt passport & save to mongoose & it is after the schema
userDataSchema.plugin(findOrCreate);

const User = mongoose.model("User", userDataSchema);

//passport-local config start & it will be just below the model.//it's a local Strategy
passport.use(User.createStrategy());
//
// passport.serializeUser(User.serializeUser()); //it is use to create cookies.
// passport.deserializeUser(User.deserializeUser()); //it is use to destroy cookies.

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req, res) {
  res.render("register");
});


app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }
));

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

//****facebook authentication &login
app.get('/auth/facebook',
  passport.authenticate('facebook')
);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get("/secrets", function(req, res) {
  User.find({"secret": {$ne: null}},function(err,foundUsers){
    if (err) {
      console.log(err);
    } else {
      if(foundUsers){
        res.render("secrets",{userWithSecrets:foundUsers});
      }
    }
  });
});

app.get("/submit",function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){

  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);

    }else{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
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
