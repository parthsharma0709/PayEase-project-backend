const express = require("express");
const mongoose= require("mongoose")
const app=express();
const {z}=require("zod");
const cors= require("cors");

app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from frontend
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

require("dotenv").config();
mongoose.connect(process.env.MONGO_URL)
.then(()=>{console.log("mongodb connected")})
.catch((e)=>console.error("database connection error" , e))

  

const bcrypt=require("bcrypt");
const jwt= require("jsonwebtoken")
const { userModel, acountModel } = require("./db");
app.use(express.json());
const JWT_SECRET= require("./config");
const userAuthentication= require("./auth/usermiddleware.js");




const usernameSchema=z.string().min(3,"username must have at least 3 characters").max(20);
const FirstNameSchema=z.string().min(3,"firstname must contain at least 3 characters").max(20);
const LastNameSchema= z.string().min(3,"lasttname must contain at least 3 characters").max(20);
const PINSchema = z.string().min(4).max(4)
  


const passwordSchema=z.string().min(8).max(20)
.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
.regex(/[a-z]/, "Password must contain at least one lowercase letter")
.regex(/[0-9]/, "Password must contain at least one number")
.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const updatedBodySchema= z.object({
    username:usernameSchema.optional(),
    password:passwordSchema.optional(),
    FirstName:FirstNameSchema.optional(),
    LastName:LastNameSchema.optional()
})

const signupSchema= z.object({
    username:usernameSchema,
    password:passwordSchema,
    FirstName:FirstNameSchema,
    LastName:LastNameSchema
})

const signinSchema= z.object({
    username:usernameSchema,
    password:passwordSchema,
    PIN:PINSchema
})

const hashpassword= async (password)=>{
    const saltRound=10;
      return await bcrypt.hash(password,saltRound)
};

app.post('/api/v1/user/signup', async (req, res)=>{
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
    FirstName:validateData.data.FirstName,
    LastName:validateData.data.LastName,
    password:hashedpassword

   })


   

   res.status(201).json({
    message:"signed up sucessfully",
    data:validateData.data
   })
});

app.post('/api/v1/user/signin' , async (req,res)=>{
    const validateData= signinSchema.safeParse(req.body);

    if(!validateData.success){
        res.status(400).json({
            message:"please enter valid username and password",
            errors:validateData.error.errors
        })
        return ;
    }
    const { username, password, PIN } = validateData.data;
    const user= await userModel.findOne({username: username});
    if(!user || (!await bcrypt.compare(password,user.password))){
        res.status(400).json({
            message:"please enter correct username and password to continue "
        })
        return ;
    }

    

    const token= jwt.sign({userId:user._id}, JWT_SECRET);
    const existingAccount = await acountModel.findOne({ userId: user._id });
    if (!existingAccount) {
        await acountModel.create({ userId: user._id, balance: 10000 ,username:username , PIN:PIN});
    }
  
       
    
    res.status(200).json({
        message:"signed in suessfully",
        token:token
    })
})

app.put('/api/v1/user/updateUser',userAuthentication, async  (req,res)=>{
   
    const updatedBody= updatedBodySchema.safeParse(req.body);

    if(!updatedBody.success){
        res.status(411).json({
            message:"enter right credintials to update "
        })
        return;
    }
    const updatedHashedpassword= await hashpassword(updatedBody.data.password);
 try {
    const updatedData= await userModel.updateOne({ _id: req.userId}, { 
        $set: { 
            username: updatedBody.data.username,
            password: updatedHashedpassword,
            FirstName: updatedBody.data.FirstName,
            LastName: updatedBody.data.LastName
        } 
    })
    res.json({
        message:"user's data has been updated successfully",
        data:updatedData
    })
 }
 catch(error){
    req.json({"message":"problem while updating data"})
 }

})

app.get('/api/v1/user/getUser', userAuthentication, async (req,res)=>{
    const userId= req.userId;
    const user= await userModel.findById(userId);
    res.json({
        FirstName:user.FirstName
    })
})

app.get('/api/v1/user/getPIN',userAuthentication, async (req,res)=>{

    const userId= req.userId;
    const response= await acountModel.findOne({userId});
    res.json({message:"PIN has set successfully", PIN:response.PIN})
})

app.put('/api/v1/user/resetPIN', userAuthentication, async (req, res) => {
    const userId = req.userId;
   
    const newPIN = PINSchema.safeParse(req.body.PIN);
  
    
    if (!newPIN.success) {
        console.log("Validation failed:", newPIN.error);
      return res.status(400).json({ message: "Please enter a valid PIN." });
    }
  
    try {
        const updatedPIN = newPIN.data; 
      
      
      await acountModel.updateOne(
        { userId: userId },
        { $set: { PIN: updatedPIN } }
      );
  
      res.status(200).json({ message: "Your PIN has been updated successfully." });
    } catch (error) {
      console.error("Error updating PIN:", error);
      res.status(500).json({ message: "An error occurred while updating the PIN." });
    }
  });
  

app.get('/api/v1/user/bulkUsers', userAuthentication, async (req,res)=>{
    const filter= req.query.filter || " " ;
    const signedInUserId= req.userId;
    const users= await userModel.find({
        _id: { $ne: signedInUserId },
        $or:[
            {FirstName :{'$regex':filter, '$options': 'i'}},
            {LastName:{'$regex':filter,'$options': 'i'}}
        ]
    })

    res.json({
        message:"here are your users" ,
        user:users.map(user =>({
            username:user.username,
            FirstName:user.FirstName,
            LastName:user.LastName,
            _id:user._id
        }))
    })
})

app.get('/api/v1/user/getBalance', userAuthentication, async (req, res)=>{
    const userId= req.userId;
   try{
    const account= await acountModel.findOne({userId:userId}); 
    res.json({
        message: "your account balance is rupees",
        balance:account.balance
       
    })
         }
    catch(error){
        res.status(403).json({
            message:"unable to load balanace , please try again later"
        })
    }

})

app.post('/api/v1/user/moneyTransfer', userAuthentication, async (req,res)=>{
    //create a session
    const session = await mongoose.startSession();
    // start a transaction
    session.startTransaction();

    const {amount , toId} =req.body;

    const sender = await acountModel.findOne({userId:req.userId}).session(session);
    if(!sender || (sender.balance<amount)){
        await session.abortTransaction();
        res.json({
            message:"insufficient balance , transaction failed"
        })
        return;
    }
   

    const receiver= await acountModel.findOne({userId:toId}).session(session);

    if(!receiver){
        await session.abortTransaction();
        res.status(411).json({
            message:"receiver not found "
        })
        return;
    }

    // perform the transaction

    await acountModel.updateOne({userId:req.userId},{$inc :{balance: -amount}}).session(session);
    await acountModel.updateOne({userId:toId},{$inc:{balance:amount}}).session(session);

    await session.commitTransaction();
    res.json({
        message:`transaction of Rs ${amount} is successfull` 
    })
})










app.listen(3000,()=>{
    console.log("server is listening at port:3000");
})


