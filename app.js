require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { Schema,model } = mongoose;
const encrypt = require("mongoose-encryption");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new Schema({
  email:String,
  password:String
})

//This must happen before we create the model since the Schema
//will be used in the model.

userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]}); //Only encrpt the password field so that it's easy to search for the email.
//We don't have to change other code since mongoose encrpt will encrpt our password when we use .save() and will decrypt when we use .find()

const User = model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
})

app.route("/login")
  .get(function(req,res){
    res.render("login");
  })
  .post(function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username},function(err,doc){
      //cannot put password into the filter after we use mongoose encrption but we can use it
      //in the callback function
      if(!err){
        if(doc&&doc.password===password){
          res.render("secrets");
        }else{
          res.send("No such user.")
        }
      }else{
        console.log(err);
        res.send(err);
      }
    })
  });



app.route("/register")
  .get(function(req,res){
    res.render("register");
  })
  .post(function(req,res){
    const newUser = new User({
      email:req.body.username,
      password:req.body.password
    });

    newUser.save(function(err){
      if(!err){
        res.render("secrets");
      }else{
        res.send(err);
      }
    })
  });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
