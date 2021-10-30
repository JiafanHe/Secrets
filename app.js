require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { Schema,model } = mongoose;
const md5 = require('md5');  //a JavaScript function for hashing messages with MD5.
//Hash function cannot be reversed back and should be injective.
const bcrypt = require('bcrypt');  //Use bcrypt to help you hash passwords

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
      if(!err){
        if(doc){
          bcrypt.compare(password, doc.password, function(err, result) {
            if(result==true){
                res.render("secrets");
            }else{
              res.send("Password is wrong")
            }
          });
        }
        else{
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
    bcrypt.hash(req.body.password, 10, function(err, hash) {
      const newUser = new User({
        email:req.body.username,
        password:hash
      });
      newUser.save(function(err){
        if(!err){
          res.render("secrets");
        }else{
          res.send(err);
        }
      })
    });

  });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
