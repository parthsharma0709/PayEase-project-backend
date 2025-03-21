const express = require("express");
const mongoose= require("mongoose")
const app=express();
const {z}=require("zod");
const cors= require("cors");
const bcrypt=require("bcrypt");
const jwt= require("jsonwebtoken")
const { userModel } = require("./db");
app.use(express.json());
const URL= "mongodb+srv://05sharmaparth:wo169YrK6CdxJN33@cluster0.99okb.mongodb.net/Paytm-project";
const JWT_SECRET= require("./config");

mongoose.connect(URL)
.then(()=>{console.log("mongodb connected")})
.catch((e)=>console.error("database connection error" , e))

const usernameSchema=z.string().min(3,"username must have at least 3 characters").max(20);

const passwordSchema=z.string().min(8).max(20)
.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
.regex(/[a-z]/, "Password must contain at least one lowercase letter")
.regex(/[0-9]/, "Password must contain at least one number")
.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const signupSchema= z.object({
    username:usernameSchema,
    password:passwordSchema
})

const signinSchema= z.object({
    username:usernameSchema,
    password:passwordSchema
})

const hashpassword= async (password)=>{
    const saltRound=10;
      return await bcrypt.hash(password,saltRound)
};

app.post('/api/v1/signup', async (req, res)=>{
   const validateData= signupSchema.safeParse(req.body);
  // it has data feild which has username and password and sucess filed which shows true on sucesss and an array of errors
   if(!validateData.success){
    res.status(400).json({
        message:"please enter valid username and password",
        errors: validateData.error.errors
    })
    return;
   }

   const hashedpassword =await hashpassword(validateData.data.password);

   await userModel.create({
    username:validateData.data.username,
    password:hashedpassword
   })

   res.status(201).json({
    message:"signed up sucessfully",
    data:validateData.data
   })
});

app.post('/api/v1/signin' , async (req,res)=>{
    const validateData= signinSchema.safeParse(req.body);

    if(!validateData.success){
        res.status(400).json({
            message:"please enter valid username and password",
            errors:validateData.error.errors
        })
        return ;
    }

    const user= await userModel.findOne({username: validateData.data.username});
    if(!user || (!await bcrypt.compare(validateData.data.password,user.password))){
        res.status(400).json({
            message:"please enter correct username and password to continue "
        })
        return ;
    }

    const token= jwt.sign({userId:user._id}, JWT_SECRET, {expiresIn:"1h"})
    res.status(200).json({
        message:"signed in suessfully",
        token:token
    })





})










app.listen(3000,()=>{
    console.log("server is listening at port:3000");
})


