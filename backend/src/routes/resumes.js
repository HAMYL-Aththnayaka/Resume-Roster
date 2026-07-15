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

const objectSchema = z.string().refine((v)=> mongoose.isValidObjectId(v),{message:"invalid id"});
const idParam = z.object({id:objectSchema});

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
                   "Untitled Resume";

    const resume = await Resume.create({
        userId:req.user,_id,
        title,
        latestVersionNumber:1,
    });

    const version = await ResumeVersion.create({
        resumeId: resume._id,
        versionNumber:1,
        label:"V1",
        rawText:text,
        parsedSections,
        sourceType:"upload",
        parentVersionId:null,
    });
    resume.currentVersionId = version._id;
    await resume.save();

    res.status(201).json({resume,version,meta});

}));

router.get("/",
   asyncHandler(async (req, res) =>{
        const resume = await Resume.find({userId : req.user}).sort({updatedAt: -1}).lean();
        res.json({resume});
    })
);

router.get("/:id",
    validate(idParam,"params"),asyncHandler(async (req, res) =>{
        const resume = await loadOwnedResume(req);
        const version = (await ResumeVersion.find({resumeId: resume._id})).sort({versionNumber: 1}).select("-rawText").lean();
        res.json({resume,version});
    })
);

router.delete("/:id",validate(idParam,"params"),
              asyncHandler(async (req , res)=>{
                const resume = await loadOwnedResume(req);
                await ResumeVersion.deleteMany({resumeId:resume._id});
                res.json({ok:true});
              }));

              module.exports =router;