
const asyncHendler =(requestHandler)=>{
  return  (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

export {
    asyncHendler,
}

/*

// const asyncHendler =() =>{}
// const asyncHandler =(func)=> ()=>{}
// const asyncHandler =(func)=> async() => {}

const asyncHendler =(fu)=> async (req,res,next)=>{

    try {
        await fn(req,res,next)

    } catch (error){
        res.status(err.code ||500).json({
            success:false,
            message:err.message
        })
    }
}






*/