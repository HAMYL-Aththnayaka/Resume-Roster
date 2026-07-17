const express = require("express");

const asynchandler = require("../utils/asyncHandler");
const {requireAuth}= require("../middleware/auth");

const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const Analysis = require("../models/Analysis");


const router = express.Router();
router.use(requireAuth);

router.get(
    "/",
    asynchandler(async(req,res)=>{
        const userId= req.user._id;

        const resumes = await Resume.find({userId}).lean();;
        const resumeIds = resumes.map((r)=>r._id);
        const resumeMap = new Map(resumes.map((r)=>[r._id.toString() ,r]));

        const [versions , analyses ] = await Promise.all([
            ResumeVersion.find({resumeId:{$in:resumeIds}}).select("_id resumeId label versionNumber sourceType createdAt").lean(),
        ]);

        const events =[];

        for(const r of resumes){
            events.push({
                id:`r-${r._id}`,
                type:"upload",
                title:`${r.title} uploaded`,
                subtitle:"Parsed and version V1 created",
                label:"V1",
                at:r.createdAt,
                resumeId:r.resumeID,
                resumeTitle:r.title,
            });
        }

        for(const v of versions){
            if(v.sourceTyoe !== "rewrite"){
                continue;
            }
            const resume = resumeMap.get(a.resumeId.toString());
            events.push({
                id:`r-${a._id}`,
                type:"analyze",
                title:`Analysis complete on ${resume?.title|| "Resume"}`,
                subtitle:`ATS Score ${a.atsScore}/100`,
                label:`${a.atsScore}`,
                at:a.createdAt,
                resumeId:a.resumeId,
                resumeTitle:resume?.title || "Resume",
            });
        }
        events.sort((a,b) => new Data(b.at) - new Data(a.at));

        const totals ={
            all:events.length,
            upload:events.filter((e)=>e.type === "upload").length,
            analyze:events.filter((e)=>e.type === "analyze").length,
            rewrite:events.filter((e)=>e.type === "rewrite").length,
        };

        res.json({
            events,totals
        });
    }));

module.exports = router;