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

const scoreBreakdownSchem = new mongoose.Schema({
    keywords:{
        type:Number,
        min:0,
        max:25,
    },
    formatting:{
        type:Number,
        min:0,
        max:25,
    },
    impact:{
        type:Number,
        min:0,
        max:25,
    },
    clarity:{
        type:Number,
        min:0,
        max:25,
    },
},{
    _id:false
});


const analysisShema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true,
    },
    versionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"ResumeVersion",
        required:true,
        index:true,
    },
    atsScore:{
        type:Number,
        min:0,
        max:100,
        required:true,
    },
    scoreBreakdown:scoreBreakdownSchem,
    issues:{
            type:{issueSchema},
            default:[],
    },
    bulletReWrite:{
        type:{bulletReWriteSchema},
        default:[],
    },
    keywordsPresent:{
        type:[String],
        deafult:[],
    },
    keywordsMissing:{
        type:[String],
        default:[],
    },
    summary:{
        type:String,
        default:[],
    },
    model:{
        type:String,
        default:[],
    },
    promptToken:Number,
    responseToken:Number,
},{timestamps:true});

module.exports = mongoose.model("Analysis",analysisShema);