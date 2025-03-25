
const mongoose= require("mongoose");
const { string } = require("zod");

const Schema=mongoose.Schema;
const ObjectId=mongoose.ObjectId;

const userSchema= new mongoose.Schema({
    username : {
        type:   String,
        unique:true,
        required:true,
        trim:true
    },
    FirstName :{
        type:String,
        required:true,
        trim:true
    },
    LastName:{
        type:String,
        require:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    }
})



const userModel= new mongoose.model("User",userSchema);

const accountSchema= new mongoose.Schema({
    userId :{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    balance:{
        type:Number,
        required:true,
        trim:true
    },
   username : {
        type:   String,
        unique:true,
        required:true,
        trim:true
    },
    PIN :{
        type:Number,
        
    }

})

const acountModel= new mongoose.model('Account',accountSchema);

module.exports={
    userModel,
    acountModel

}