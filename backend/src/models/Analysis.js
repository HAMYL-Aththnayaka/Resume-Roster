const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    severity:{
        type:String,
        enum:["low","medium","high"],defualt:"medium"
    },
    explanation:String,
    fix:String,
},
{_id:false});

const strenghtSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    evidence:String
},
{_id:false});

const bulletReWriteSchema =new mongoose.Schema({
    section:String,
    original:{
        type:String,
        required:true,
    },
    rewritten:{
        type:String,required:true
    },
    rationale:String,
},
{_id:true});//front end can target this id
