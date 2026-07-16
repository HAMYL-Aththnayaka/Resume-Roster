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

const {analizeLimiter} = require("../middleware/rateLimit");
const Analysis = require("../models/Analysis");;
const {analyzeResume} = require("../services/geminiService");


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
                await Analysis.deleteMany({resumeId:resume._id});
                await resume.deleteOne();
                res.json({ok:true});
}));

const analyzeBody = z.object({
    versionId:objectSchema.optional(),
    targetRole:z.string().trim().max(120).optional(),
});

router.post("/:id/analyze",analizeLimiter,
    validate(idParam,"params"),
    validate(analyzeBody),
    asyncHandler(async (req, res)=>{
        const resume = await loadOwnedResume(req);

        const versionId = req.body.versionId || resume.currentVersionId;
        if(!validate){
            throw ApiError.badRequest("NO version to analyze");        
        }
         const version = await loadVersion(resume._id , versionId);

            const {analysis,model,promptTokens,responseTokens} = 
            await analyzeResume({
                rawText:version.rawText,
                targetRole:req.body.targetRole,
            });
        const saved = await Analysis.create({
            userId: req.user._id,
            resumeId:resume._id,
            versionId:version._id,
            atsScore:analysis.atsScore,
            scoreBreakdown:analysis.scoreBreakdown,
            issues:analysis.issues,
            strengths:analysis.strenghts,
            bulletRewrittes:analysis.bulletRewrites,
            keywordsPresent:analysis.keywordsPresent,
            keywordsMissing:analysis.keywordsMissing,
            summery: analysis.summery,
            model,
            promptTokens,
            responseTokens,
        });
        version.latestAnalysisId =saved._id;
        await version.save();

        res.status(201).json({
            analysis:saved
        });
    })
);

router.get("/:id/analyses",
    validate(idParam,"params"),
    asyncHandler(async (req ,res)=>{
        const resume = await loadOwnedResume(req);
        const analyses = await Analysis.find({resumeId:resume._id}).sort({createdAt:-1}).lean();
        res.json({analyses});
    })
);
router.get("/:id/versions/:versionId/analysis",
    validate(z.object({
        id: objectSchema,
        versionId: objectSchema
    }), "params"),
    asyncHandler(async(req,res)=>{
        const resume = await loadOwnedResume(req);
        const version = await loadVersion(resume._id, req.params.versionId);

        const analysis = await Analysis.findOne({
            resumeId: resume._id,
            versionId: version._id
        }).sort({createdAt:-1}).lean();

        res.json({analysis: analysis || null});
    })
);


module.exports =router;