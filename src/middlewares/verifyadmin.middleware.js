import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
    const token = req?.cookies?.adminToken;

    if(!token){
        return next();
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { status: decoded?.status || "user"};
    next();

};

