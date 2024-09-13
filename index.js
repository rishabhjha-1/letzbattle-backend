// // index.js
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const { PrismaClient } = require('@prisma/client');
// const { OAuth2Client } = require('google-auth-library');

// const app = express();
// const prisma = new PrismaClient();

// app.use(express.json()); // Middleware to parse JSON requests

// // Middleware to authenticate and extract the JWT
// // const authenticateToken = (req, res, next) => {
// //   const authHeader = req.headers['authorization'];
// //   // const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token
// //   const token = req.headers.authorization;
// //   console.log({token})
// //   // if (!token) {
// //   //   return res.sendStatus(401); // Unauthorized if no token
// //   // }

// //   // jwt.verify(token, "supersecret", { algorithms: ['RS256'] }, (err, user) => {
// //   //   if (err) {
// //   //     console.error("Token verification failed:", err); // Log the error
// //   //     return res.sendStatus(403); // Forbidden if token is invalid
// //   //   }
// //   //   req.userId = user.sub; // Extract user ID from the JWT
// //   //   next();
// //   // });
// //   if (token) {
// //     jwt.verify(token, "supersecret", (err, decoded) => {
// //         if (err) {
// //             res.status(401).send({
// //                 message: "Unauthorized"
// //             })
// //         } else {
// //             req.user = decoded;
// //             next();
// //         }
// //     })
// // } else {
// //     res.status(401).send({
// //         message: "Unauthorized"
// //     })
// // }
  
// // };

// const CLIENT_ID ="739377018987-q5r2dqm40em1t0objd2vspdnset4ptcs.apps.googleusercontent.com"
// const client = new OAuth2Client(CLIENT_ID);
// const verifyGoogleToken = async (token) => {
//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
//     });
//     const payload = ticket.getPayload();  // This contains the user information
//     return payload;
//   } catch (error) {
//     console.error("Error verifying token:", error);
//     return null;
//   }
// };

// // Middleware to verify the token
// const authenticateToken = async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (authHeader) {
//     const token = authHeader.split(' ')[1]; // Extract token from `Bearer <token>`
//     const userPayload = await verifyGoogleToken(token);

//     if (userPayload) {
//       req.user = userPayload; // Attach user info to the request
//       next();
//     } else {
//       return res.status(403).json({ message: 'Invalid or expired token' });
//     }
//   } else {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }
// };

// // Onboarding API
// app.post('/api/onboard', authenticateToken, async (req, res) => {
//   const { name } = req.body;

//   if (!name || !phoneNumber) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   try {
//     // Update the user's name, phone number, and set isOnboarded to true
//     const updatedUser = await prisma.user.update({
//       where: { id: req.userId }, // Use the user ID from JWT
//       data: {
//         name,
//         isOnboarded: true,
//       },
//     });

//     res.status(200).json({ message: 'User onboarded successfully', user: updatedUser });
//   } catch (error) {
//     console.error('Error onboarding user:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Start the Express server
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const prisma = new PrismaClient();

// Google OAuth client ID
const CLIENT_ID = '739377018987-q5r2dqm40em1t0objd2vspdnset4ptcs.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());

// Function to verify Google token
const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload(); // Payload contains user info like email, name, etc.
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error.message); // Log error message for clarity
    return null;
  }
};

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Extract Bearer token
    const userPayload = await verifyGoogleToken(token);

    if (userPayload) {
      req.user = userPayload; // Attach user info to request
      next();
    } else {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};

// Onboarding API route
app.post('/api/onboard', authenticateToken, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing name field' });
  }

  try {
    // Assuming req.user.sub contains the user's Google ID (sub is Google's unique identifier for the user)
    const updatedUser = await prisma.user.update({
      where: { email: req.user.email }, // Identify user by email or other unique identifier
      data: {
        name,
        isOnboarded: true,
      },
    });

    res.status(200).json({ message: 'User onboarded successfully', user: updatedUser });
  } catch (error) {
    console.error('Error onboarding user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
