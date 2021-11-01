require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { Schema,model } = mongoose;
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');   //require this madeup function in the documentation or write it by ourselves


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//set up according to express-session document
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}))

//set up according to passport document
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new Schema({
  email:String,
  password:String
})

//-------------------------set up according to passport-local-mongoose---------
userSchema.plugin(passportLocalMongoose);  //Plugin Passport-Local-Mongoose
userSchema.plugin(findOrCreate); //Plugin findOrCreate

const User = model("User",userSchema);

//-----------------Configure Passport/Passport-Local---------------------------

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());   //creates that fortune cookie and stuffs the message namely our users identifications into the cookie.
passport.deserializeUser(User.deserializeUser());  //allows passport to be able to crumble the cookie and discover the message inside which is who this user is.
//----------------------------------------------------------------------------

passport.use(new GoogleStrategy({       //Cannot put before app.use(session) otherwise it won't save the user login sessions
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"   //same as the authorized redirect URIs set up in the credentials in google developer console
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
  res.render("home");
})

app.route("/login")
  .get(function(req,res){
    res.render("login");
  })
  .post(function(req,res){

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    //passport provide a method to login
    req.login(user, function(err) {
      if (err) {
        console.log(err);
        res.send(err);
      }
      else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        });
      }
    });

  });

app.route("/register")
  .get(function(req,res){
    res.render("register");
  })
  .post(function(req,res){
    //From passport-local-mongooes package
    User.register({username:req.body.username, active: true}, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/");
      }else{
        //authenticate this user
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        });
      }
    });
  });

app.route("/secrets")
  .get(function(req,res){
    //check whether the user is logged in
    if(req.isAuthenticated()){
      res.render("secrets");
    }else{
      res.redirect("/login");
    }
  });

app.route("/logout")
  .get(function(req,res){
    //passport provides a method to logout
    req.logout();
    res.redirect("/");
  })

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));  //From http://www.passportjs.org/packages/passport-google-oauth20/


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
