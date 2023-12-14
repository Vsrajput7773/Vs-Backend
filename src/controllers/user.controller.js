import { asyncHendler } from "../utils/asyncHendler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import{ApiResponse} from '../utils/ApiResponse.js'


const generateAccessTokenAndRefreshTokens =async(userId)=>{
    try {
        const user =await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken =user.generateRefreshToken()

        user.refreshToken =refreshToken
        await user.save({validateBeforeSave:false})

        return{accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,"Somthing went wrong while generating refresh and access token")
    }
}





const registerUser =asyncHendler(async(req,res)=>{
    // get user deatails from frontend
    // validation -not empty
    // check for user already exists:username ,email
    // check for images,check for avatar
    // upload them to cloudinary ,avatar
    // create user object - create entry in db 
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const { fullName, email, userName, password }= req.body

    // console.log("email: ",email);

    if(
        [fullName, email, userName, password].some((field)=>
        field?.trim()===""
        )){
            throw new ApiError(400,"All fields are required")
        }

        const existedUser =await User.findOne({
            $or:[{userName},{email}]
        })
    
        if(existedUser){
            throw new ApiError(409,"user with email or username already exists")
        }
        // console.log(req.files);

        const avatarLocalPath =req.files?.avatar[0]?.path;
        // const coverImageLocalPath =req.files?.coverImage[0]?.path;

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
            coverImageLocalPath=req.files.coverImage[0].path
        }

        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is required")
        }

        const avatar =await uploadOnCloudinary(avatarLocalPath)
        const coverImage=await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar){
            throw new ApiError(400,"Avatar file is required")
            
        }

        const user =await User.create({
            fullName,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            userName: userName.toLowerCase()
        })

        const createdUser =await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if(!createdUser){
            throw new ApiError(500,"Somthing went wrong while registering the user")

        }

        return res.status(201).json(
            new ApiResponse(200,createdUser,"user registerd successfully")
        )



})

const loginUser =asyncHendler(async (req,res)=>{
    // req body = data ,username oe gmail ,find the user password ,check ,access and refresh token , send cookie 

    const {email,username,password}= req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400,"username or email is required")
        
    }
    // Here is an alternative of about code based on logic discussed in video:
    // if (!(username || email)) {
        // thorw new ApiError(400,"username or email is required")
    // }

        const user=await User.findOne({
            $or:[{username},{email}]
        })

        if(!user){
            throw new ApiError(404,"User dose not exist")
        }

        const isPasswordValid =await user.isPasswordCorrect(password)

        if(!isPasswordValid){
            throw new ApiError(401,'Incorrect Password')
        }

        const {accessToken,refreshToken}= await generateAccessTokenAndRefreshTokens(user._id)

        const loggedInUser =await
        User.findById(user._id).select("-password -refreshToken")

        const options ={
            httpOnly:true,
            secure:true
        }

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                   user:loggedInUser,accessToken,refreshToken 
                },
                "User logged In Successfully"
            )
        )
})


const logoutUser=asyncHendler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}