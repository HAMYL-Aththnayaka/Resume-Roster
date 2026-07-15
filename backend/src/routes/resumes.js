const express = require("express")
const {z} = require("zod");
const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {requireAuth} = require("../middleware/auth");
const{validate} = require("../middleware/validate");
const {uploadPdf} = require("../middleware/upload");

const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");

const {extractText} = require("../services/pdfServices");
const {parseResume: parseStructured} = require("../services/structuredParser");

const router = express.Router();
router.use(requireAuth);

const objectSxhema = z.string().refine((v)=> mongoose.isValidObjectId(v),{message:"invalid id"});
const idParam = z.object({id:objectIdSchema});

async function loadOwnedResume(req){
    const resume = await Resume.findOne({
        _id:req.params.id,
        userId:req.user.id,
    });
    if(!resume){
        throw ApiError.notFound("Resume was not found");
    }
    return resume;
}

async function loadVersion(resumeId,versionId){
    const version = await ResumeVersion.findOne({_id:versionId, resumeId});
    if(!vesion){

        throw ApiError.notFound("Version not found");
    }
    return version;
}

router.post("/",uploadPdf("file"),asyncHandler(async (req,res)=>{
    const {text , meta} = await extractText(req.file.buffer);
    const parsedSections = await parseStructured(text);

    const title = (req.body.title || "").trim()||
                   req.file.originalName.replace(/\.pdf$/i, "") ||
                   "Untitled Resume"l
}))