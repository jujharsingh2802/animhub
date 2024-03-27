const asyncHandler = (responseHandler) =>{
    return (req,res,next) =>{
        Promise.resolve(responseHandler(req,res,next))
        .catch((error)=>next(error))
    }
}

export {asyncHandler}