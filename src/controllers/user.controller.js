import { asyncHendler } from "../utils/asyncHendler.js";

const registerUser =asyncHendler(async(req,res)=>{
    res.status(200).json({
        message:" success"
    })
})

export {
    registerUser,
}