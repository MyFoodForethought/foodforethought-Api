const jwt = require('jsonwebtoken');
const { Utils } = require('../middleware/utils');

const utils = new Utils();

class Auth {
  constructor() {
    this.blacklist = new Set(); // Set to store invalidated tokens
  }

  // Generate authentication token with user's email
  generateAuthToken(user) {
    const tokenData = {
      email: user.email, // Using email instead of userId
    };
    return jwt.sign(tokenData, process.env.ACCESS_TOKEN_SECRET); // Token expiry set to 1 hour
  }

  // Middleware to check for token and verify it
  async tokenRequired(req, res, next) {
    const authHeader = req.headers['authorization']; // Retrieve the authorization header
    if (!authHeader) {
      return res.status(401).json({
        status: false,
        error: utils.getMessage('TOKEN_ERROR'), // Custom error message for missing token
      });
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    
    try {
      // Verify the token
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) => {
        if (err) {
          console.error('Token Verification Error:', err);
          return res.status(403).json({
            status: false,
            error: utils.getMessage('INVALID_TOKEN_ERROR'), // Custom error message for invalid token
          });
        }

        // Check if decoded token is valid (an object)
        if (typeof decodedToken === 'object' && decodedToken !== null) {
          console.log('Decoded Token:', decodedToken);
          req.user = decodedToken.email; // Attach the email from the decoded token to req.user
          next(); // Proceed to the next middleware
        } else {
          console.log('Invalid Decoded Token:', decodedToken);
          return res.sendStatus(403); // Token not valid
        }
      });

      console.log('authHeader:', authHeader); // For debugging
      console.log('token:', token);           // For debugging
    } catch (err) {
      console.error('Unexpected Error in Token Verification:', err);
      return res.status(500).json({
        status: false,
        error: utils.getMessage('INTERNAL_SERVER_ERROR'), // Custom error message for server errors
      });
    }
  }

  // Invalidate a token and add it to the blacklist
  invalidateToken(token) {
    this.blacklist.add(token);
  }

  // Check if a token is blacklisted (invalid)
  isTokenInvalid(token) {
    return this.blacklist.has(token);
  }
}

module.exports = {
  Auth
};











































// const jwt = require('jsonwebtoken')
// const {Utils} = require('../middleware/utils')

// const utils = new Utils();

// class Auth {
//     constructor() {
//         this.blacklist = new Set(); // Set to store invalidated tokens
//       }
//     generateAuthToken(user){
//         const tokenData = {
//             email:user.email
//         }
//         return jwt.sign(tokenData,process.env.ACCESS_TOKEN_SECRET)

//     }
//     async tokenRequired(req, res, next){

//         const authHeader = req.headers['authorization']
//         if (!authHeader) {
//           return res.status(401).json({
//             status: false,
//             error: utils.getMessage('TOKEN_ERROR')
//           })
//         }
//         const token = authHeader.split(' ')[1]
//         try {
//             jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decodedToken)=>{

//                 if (typeof decodedToken === 'object' && decodedToken !== null) {
//                   console.log('Decoded Token:', decodedToken);
//                     req.user = decodedToken;
//                   } else {
//                     return res.sendStatus(403);
//                   }
//                 next()
//             })
//             console.log('authHeader:', authHeader);
// console.log('token:', token);

//         } catch (err) {
//             return res.status(500).json({
//                 status:false,
//                 error: utils.getMessage('INTERNAL_SERVER_ERROR')
//             })
//         }

//     }
//     // Invalidate a token and add it to the blacklist
//   invalidateToken(token) {
//     this.blacklist.add(token);
//   }
//   // Check if a token is blacklisted (invalid)
//   isTokenInvalid(token) {
//     return this.blacklist.has(token);
//   }



// }

// module.exports = {
//     Auth
// }
