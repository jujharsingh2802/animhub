const asyncHandler = (responseHandler) =>{
    (req,res,next) =>{
        Promise.resolve(responseHandler(req,res,next))
        .catch((error)=>next(error))
    }
}

export {asyncHandler}