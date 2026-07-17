const { GoogleGenAI, Type } = require("@google/genai");

const env = require("../config/env");

const ai = env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
    : null;


const linkSchema = {
    type: Type.OBJECT,
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
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
        "languages",
        "interests"
    ],

    properties: {

        basics: {
            type: Type.OBJECT,
            required: [
                "name",
                "title",
                "location",
                "email",
                "phone",
                "links"
            ],
            properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                location: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },

                links: {
                    type: Type.ARRAY,
                    items: linkSchema
                }
            }
        },


        summary: {
            type: Type.STRING
        },


        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,

                required: [
                    "company",
                    "role",
                    "period",
                    "bullets"
                ],

                properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    location: { type: Type.STRING },
                    period: { type: Type.STRING },

                    bullets: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        }
                    }
                }
            }
        },


        education: {
            type: Type.ARRAY,

            items: {
                type: Type.OBJECT,

                required: [
                    "degree",
                    "school",
                    "period"
                ],

                properties: {
                    degree: { type: Type.STRING },
                    school: { type: Type.STRING },
                    location: { type: Type.STRING },
                    period: { type: Type.STRING },
                    details: { type: Type.STRING }
                }
            }
        },


        skills: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            }
        },


        projects: {
            type: Type.ARRAY,

            items: {
                type: Type.OBJECT,

                required: [
                    "name",
                    "description"
                ],

                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },

                    tech: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        }
                    },

                    links: {
                        type: Type.ARRAY,
                        items: linkSchema
                    }
                }
            }
        },


        certifications: {
            type: Type.ARRAY,

            items: {
                type: Type.OBJECT,

                required: [
                    "name"
                ],

                properties: {
                    name: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    year: { type: Type.STRING }
                }
            }
        },


        languages: {
            type: Type.ARRAY,

            items: {
                type: Type.STRING
            }
        },


        interests: {
            type: Type.ARRAY,

            items: {
                type: Type.STRING
            }
        }
    }
};



function buildPrompt(rawText) {

    return [
        "You are a professional resume parser.",
        "Extract structured information from the resume text.",
        "",
        "Rules:",
        "- Do not invent information.",
        "- Keep dates exactly as written.",
        "- Extract bullet points as complete sentences.",
        "- Use empty arrays or strings if information is missing.",
        "",
        "Extract:",
        "- Personal information",
        "- Summary",
        "- Work experience",
        "- Education",
        "- Skills",
        "- Projects",
        "- Certifications",
        "- Languages",
        "- Interests",
        "",
        "RESUME TEXT:",
        "----------------",
        rawText,
        "----------------"
    ].join("\n");
}



const EMPTY = {

    basics: {
        name: "",
        title: "",
        location: "",
        email: "",
        phone: "",
        links: []
    },

    summary: "",

    experience: [],

    education: [],

    skills: [],

    projects: [],

    certifications: [],

    languages: [],

    interests: []
};



async function parseResume(rawText) {

    if (!ai || !rawText?.trim()) {
        return EMPTY;
    }


    const prompt = buildPrompt(rawText);


    for (let attempt = 1; attempt <= 2; attempt++) {

        try {

            const result = await ai.models.generateContent({

                model: env.GEMINI_MODEL,

                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],


                config: {

                    responseMimeType: "application/json",

                    responseSchema,

                    temperature: 0.1
                }

            });


            const text =
                typeof result.text === "function"
                    ? result.text()
                    : result.text;


            if (!text) {
                throw new Error("Empty Gemini response");
            }


            return JSON.parse(text);


        } catch (error) {

            console.error(
                "Structured parse failed:",
                error.message
            );


            if (attempt === 2) {
                return EMPTY;
            }
        }
    }


    return EMPTY;
}



module.exports = {
    parseResume
};