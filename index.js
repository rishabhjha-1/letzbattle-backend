

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const prisma = new PrismaClient();
const cors = require('cors'); 

// Google OAuth client ID
const CLIENT_ID = '739377018987-q5r2dqm40em1t0objd2vspdnset4ptcs.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
      const user = await prisma.user.findUnique({
        where: { email: userPayload.email },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = { ...userPayload, role: user.role }; // Attach user info and role to request
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
  const { name,age,instagram_id,bgmi_id,gender,intrested_game,phoneNumber } = req.body;

  if (!name || !phoneNumber) {
    return res.status(400).json({ error: 'Missing name field' });
  }

  try {
    // Assuming req.user.sub contains the user's Google ID (sub is Google's unique identifier for the user)
    const updatedUser = await prisma.user.update({
      where: { email: req.user.email }, // Identify user by email or other unique identifier
      data: {
        name,
        age,instagram_id,bgmi_id,gender,intrested_game,phoneNumber ,
        isOnboarded: true,
      },
    });

    res.status(200).json({ message: 'User onboarded successfully', user: updatedUser });
  } catch (error) {
    console.error('Error onboarding user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event creation API (Only accessible by admins)
app.post('/api/events', authenticateToken, async (req, res) => {
  const { name, date, entryFees, prize, seatsLeft } = req.body;

  // Check if the authenticated user is an admin
  if (req.user && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only admins can create events' });
  }

  // Validate required fields
  if (!name || !date || !entryFees || !prize || !seatsLeft) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create the event in the database
    const newEvent = await prisma.event.create({
      data: {
        name,
        date: new Date(date), // Ensure the date is in the correct format
        entryFees,
        prize,
        seatsLeft,
      },
    });

    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user details:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
