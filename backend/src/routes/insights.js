const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const {requireAuth}= require("../middleware/auth");

const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const Analysis = require("../models/Analysis");

const router = express.Router();
router.use(requireAuth);

function topN(items , getKey ,n = 8){
    const count = new Map();
    const extra = new Map();

    for (const item of items){
        const key = getKey(item);
        if(!key){
            continue;
        }
        count.set(key,(count.get(key) || 0) + 1);
        if(!extra.has(key)){
            extra.set(key,item);
        }
    }
    return Array.from(count.entries()).sort((a,b) => b[1] -a[1]).slice(0,n).map(([key,count])=>({key, count , sample:extra.get(key)}));
}

router.get("/",asyncHandler(async (req,res)=>{
    const userId = req.user._id;
    const resumes = await Resume.find({userId}).sort({updatedAt : -1}).lean();
    const resumeMap = new Map(resumes.map((r)=>[
        r._id.toString(),r
    ]));    
    const analysis = await Analysis.find({userId}).sort({createdAt:-1}).lean();

    if(!analysis.length){
        return res.json({
            empty:true,
            totalAnalyses:0,
            resumes:resumes.map((r)=>({
                id:r._id,
                title:r.title,
                latestVersionNumber:r.latestVersionNumber,
            })),
        });
    }
    const totalScore = analysis.reduce((s,a)=>s+a.atsScore,0);
    const averageScore = Math.round(totalScore/analysis.length);

    const bestEntry = analysis.reduce((best,a)=>a.atsScore > best.atsScore ? a:best);
    const bestResume = resumeMap.get(bestEntry.resumeId.toString());

    //The Score Trend
    const scoreTrend = analysis.map((a)=>({
        at:a.createdAt,
        score:a.atsScore,
        resumeId:a.resumeId,
        resumeTitle:resumeMap.get(a.resumeId.toString())?.title || "Resume",
    }));

    //Issue frequency
    const allIssues = analysis.flatMap((a)=> a.issues || []);
    const topIsues = topN(
        allIsues,(i)=>i.title?.trim().toLowerCase(),6
    ).map((row)=>({
        title:row.sample?.title || row.key,
        count : row.count,
        severity : row.sample?.severity || "medium",
    }));

    //Keyword Frequency
    const allMissing = analysis.flatmap((a)=>a.keywordsMissing || []);
    const allPresent = analysis.flatmap((a)=>a.keywordsPresent || []);

    const topMissing = topN(allMissing ,(k)=>k.toLowerCase(),12).map((r)=>({
        keyword:r.sample,
        count:r.count,
    }));
    
    const topPresent = topN(allPresent , (k)=>k.toLowerCase(),12).map((r)=>({
        keyword:r.sample,
        count:r.count,
    }));

    //Per-resume performance 
    const resumePerformance = resumes.map((r)=>{
        const ras = analysis.filter((a)=>a.resumeId.toString() === r._id.toString());
        
        if(!ras.length){
            return null;
        }
        const latest = ras[ras.length-1];
        const best = ras.reduce((b,a)=>(a.atsScore>b.atsScore ? a:b));
        return{
            resumeId:r._id,
            title:r.title,
            analysesCount : ras.length,
            latestScore:latest.atsScore,
            bestScore:best.atsScore,
        };
    }).filter(Boolean).sort((a,b)=>b.latestScore - a.latestScore);

    res.json({
        empty:false,
        totalAnalyses:analyses.length,
        averageScore,
        bestScore:{
            value:bestEntry.atsScore,
            resumeId:bestEntry.resumeId,
            resumeTitle:bestResume?.title || "Resume",
            at: bestEntry.createdAt,
        },
        scoreTrend,
        topIssues,
        topMissingKeywords:topMissing,
        topPresentKeywords: topPresent,
        resumePerformance,
    });

}));
module.exports =router;