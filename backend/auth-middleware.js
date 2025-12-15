const { auth } = require('express-oauth2-jwt-bearer');

const jwtCheck = auth({
    
    issuerBaseURL: process.env.AUTH0_ISSUER,
    
    
    audience: process.env.AUTH0_AUDIENCE,
});

module.exports = { jwtCheck };