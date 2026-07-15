const {GoogleGenAi,Type} = require("@google/genai");
const {z} = require("zod");

const env = require("../config/env")
const ApiError = require("../utils/apiError");

const ai = env.GEMINI_API_KEY ? new GoogleGenAi({apiKey: env.GEMINI_API_KEY}) : null;

const responseSchema ={
    type:Type.OBJECT,
    required:[
        "atsScore",
        "scoreBreakdown",
        "issues",
        "strenghts",
        "bulletRewrites",
        "keywordsPresent",
        "keywordsMissing",
        "summery",
    ],
    properties:{
        atsScore:{
            type:Type.NUMBER,
            description:"ARS_readiness score from 0 to 100",
        },
        scoreBreakdown:{
            type:Type.OBJECT,
            required:["keywords","formatting","impact","clarity"],
            properties:{
                keywords:{
                    type:Type.NUMBER,
                    description:"0-25",
                },
                formatting:{
                    type:Type.NUMBER,
                    description:"0-25",
                },
                impact:{
                    type:Type.NUMBER,
                    description:"0-25",
                },
                clarity:{
                    type:Type.NUMBER,
                    description:"0-25",
                },
            },
        },
        issues:{
            type:Type.Array,
            description:"Exactly 5 prioratized issues",
            items:{
                type:Type.OBJECT,
                required:["title","serverity","explanation","fix"],
                properties:{
                    title:{
                        type:Type.STRING,
                    },
                    serverity:{
                        type:Type.STRING,
                        enum:["low","medium","high"],
                    },
                    explanation:{
                        type:Type.STRING,
                    },
                    fix:{
                        type:Type.STRING
                    },
                },
            }
        },
        strenghts:{
            type:Type.ARRAY,
            description:"Exactly 5 Strenghts",
            items:{
                type:Type.OBJECT,
                required:["title","evidence"],
                properties:{
                    title:{
                        type:Type.STRING,
                    },
                    evidence:{
                        type:Type.STRING,
                    },
                },
            },
        },
        bulletRewrites:{
            type:Type.ARRAY,
            description:"5 - 10 weak bullets rewrittes to be stronger and ATS - friendly",
            items:{
                type:Type.OBJECT,
                required:["section","original","rewritten","rationale"],
                properties:{
                    section:{
                        type:Type.STRING
                    },
                    original:{
                        type:Type.STRING
                        
                    },
                    rewritten:{
                        type:Type.STRING
                        
                    },
                    rationale:{
                        type:Type.STRING
                        
                    },
                },
            },
        },
        keywordsPresent:{
            type:Type.ARRAY,
            items:{
                type:Type.STRING,
            },
        },
        keywordsMissing:{
            type:Type.ARRAY,
            items:{
                type:Type.STRING,
            },
        },
        summery:{
            type:Type.STRING,
            description:"One short paragraph oeverall verdict",
        },
    },
};

