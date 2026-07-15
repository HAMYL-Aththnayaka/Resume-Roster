const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");

const env = require("../config/env");
const { parse } = require("dotenv");

const api = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;


const linkSchema = {
    type: Type.OBJECT,
    required: ["label,url"],
    properties: {
        label: { type: Type.STRING },
        url: { type: Type.STRING },
    },
};

const responseSchema = {
    type: Type.OBJECT,
    required: [
        "basics",
        "summary",
        "experiance",
        "education",
        "skills",
        "projects",
        "certification",
        "language",
        "interets"
    ],
    properties: {
        basics: {
            type: Type.OBJECT,
            required: ["name", "title", "location", "email", "phone", "links"],
            properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                location: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                links: { type: Type.ARRAY, items: linkSchema },
            },
        },
        summery: { type: Type.STRING },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                required: ["company", "role", "period", "bullets"],
                properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    location: { type: Type.STRING },
                    period: { type: Type.STRING },
                    bullets: {
                        type: Type.ARRAY, items: { type: Type.STRING }},
                },
            },
        },
        education:{
            type:Type.ARRAY,
            items:{
                type:Type.OBJECT,
                required:["degree","school","period"],
                properties:{
                    degree:{type:Type.STRING},
                    school:{type:Type.STRING},
                    location:{type:Type.STRING},
                    period:{type:Type.STRING},
                    details:{type:Type.STRING},
                },
            },
        },
        skills:{
            type:Type.ARRAY,items:{type:Type.STRING},
            projects:{
                type:Type.ARRAY,
                required:["name","description"],
                properties:{
                    name:{type:Type.STRING},
                    desciption:{type:Type.STRING},
                    tech:{type:Type.ARRAY,items:{type:Type.STRING}},
                    links:{type:Type.ARRAY,items:{type:linkSchema}},
                },
            },
        },
        certification:{
            type:Type.ARRAY,
            items:{
                type:Type.OBJECT,
                required:["name"],
                properties:{
                    name:{type:Type.STRING},
                    issuer:{type:Type.STRING},
                    year:{type:Type.STRING},
                },
            },
        },
        language:{type:Type.ARRAY,items:{type:Type.STRING}},
        interets:{type:Type.ARRAY,items:{type:Type.STRING}},
    },
};


function buildPrompt(rawText) {
    return [
        "You are a resume parser. The input is text extracted from a PDF - lines may be jumbled or out of natural reading order.",
        "",
        "Extract structured data:",
        "- basics: name, professional title, location, email, phone, social links (LinkedIn / GitHub / portfolio etc.; label like \"LinkedIn\", full URL)",
        "- summary: the professional summary paragraph (rejoin if split across lines)",
        "- experience: jobs most recent first, with company, role, period (preserve original date format), location if available, and bullet points",
        "- education: degree, school, period, location, optional details",
        "- skills: flat array of technical skills",
        "- projects: name, one-sentence description, optional tech tags, optional links",
        "- certifications: name, issuer, year",
        "- languages: flat array",
        "- interests: flat array",
        "",
        "Rules:",
        "- Be conservative: omit fields that are not clearly present. Use empty strings/arrays where missing.",
        "- Do not invent or paraphrase - extract verbatim where possible.",
        "- Each experience bullet should read as a complete sentence.",
        "- Preserve original date formats (e.g. 'Jan 2022 - Dec 2023').",
        "",
        "RESUME TEXT:",
        "------------------",
        rawText,
        "------------------"
    ].join("\n");
}

const EMPTY ={
    basics: {name: "",title:"",location:"",email:"",phone:"",links:[]},
    summery:"",
    experience:[],
    education:[],
    skills:[],
    projects:[],
    certification:[],
    language:[],
    interets:[],
};

async function parseResume(rawText){
    if(!ai || !rawText?.trim()) return EMPTY;

    const prompt = bulbPrompt(rawText);

    for (let attempt =1 ; attempt<=2 ;attempt++){
        try{
            const result  = await ai.models.generateContent({
                model:env.GEMINI_MODEL,
                contents:({
                    role:"user",parts:[{text:prompt}]
                }),
                config:{
                    responseMimeType:"application/json",
                    responseSchmea,
                    temperature:0.1
                },
            });
            const text = typeof result.text === "function" ? result.text():result.text;
            if(!text){
                throw new Error("Empty Response");
            }
            const parse = JSON.parse(text);
            return validator.parse(parsed);
        }catch(err){
            if(attempt ==1){
                console.error("Structured parse failed", err.message);
                return EMPTY;
            }
        }
    }
    return EMPTY;
}

module.exports ={parseResume};