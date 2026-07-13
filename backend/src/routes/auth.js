const express = require("express");
const {z} = require("zod");

const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {signToken , coockieOptions} = require("../utils/jwt");
const {validate} = require("../middleware/validate");
const {requireAuth} = require("../middleware/auth");
const {authLimiter} = require("../middleware/rateLimit");

const User = require("../models/User");

const router = express.Router();

const registerSchema = z.object({
    name:z.string().trim().min(1).max(80),
    email:z.string().trim().toLowerCase().email(),
    password:z.string().min(8).max(50),
});

const loginSchema = z.object({
    email:z.string().trim().toLowerCase().email(),
    password:z.string().min(1).max(50),
});

const profileSchema = z.object({
    name:z.string().trim().min(1).max(80),

});

const passwordSchema = z.object({
    currentPassword: z.string().min(1).max(50),
    newPassword:z.string().min(1).max(50)
});

function issueSession(res,user){
    const token = signToken({
        sub:user._id.toString()
    });
    res.cookie(env.cookieName , token, coockieOptions);
}

router.post("/register",authLimiter,validate(registerSchema),asyncHandler(async (req,res)=>{
    const {name , email , password} = req.body;

    const existing = await User.findOne({email});
    if(existing){
        throw ApiError.conflict("Email already registered");
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({name , email , passwordHash});

    issueSession(res, user);
    res.status(201).json({user});
}));

router.post("/login",authLimiter,validate(loginSchema),asyncHandler(async (req,res)=>{
    const {email , password} = req.body;
    const user = await User.findOne({email}).select("+passwordHash");
    if(!user){
        throw ApiError.unauthorized("Invalid credentials");
    }

    const passCheck = await user.comparePassword(password);
    if(!passCheck){
        throw ApiError.unauthorized("Invalid credentials");
    }
    issueSession(res,user);
    res.json({user});
}));

router.post("logout",(res,req)=>{
    res.clearCookie(env.cookieName, {...coockieOptions, maxAge:0});
    res.json({ok:true});
});

router.get("/me",requireAuth,asyncHandler(async (req , res)=>{
    res.json({user : req.user});
}));

router.patch("/profile",requireAuth,validate(profileSchema),asyncHandler(async (req,res)=>{
    req.user.name = req.body.name;
    await req.user.save();
    res.json({user:req.user});
}))

router.patch("/password",authLimiter,requireAuth,validate(passwordSchema),asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id).select("passwordHash");
    if(!user){
        throw ApiError.unauthorized("session not valid");
    }

    const check = await user.comparePassword(req.body.currentPassword);
    if(!check){
        throw ApiError.unauthorized("current password is incorrect");
    }

    user.passwordHash = await User.hashPassword(req.body.newPassword);
    await user.save();
    res.json({ok:true});
}))

module.exports = router;