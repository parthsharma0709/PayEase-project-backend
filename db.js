
const mongoose= require("mongoose")
const Schema=mongoose.Schema;
const ObjectId=mongoose.ObjectId;

const userSchema= new mongoose.Schema({
    username : {
        type:   String,
        unique:true,
        required:true
    },
    FirstName :{
        type:String,
        required:true
    },
    LastName:{
        type:String,
        require:true
    },
    password:{
        type:String,
        required:true
    }
})

const userModel= new mongoose.model("User",userSchema)

module.exports={
    userModel

}