

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const prisma = new PrismaClient();
const cors = require('cors'); 
const Razorpay = require('razorpay');
const crypto = require('crypto');

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

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is up and running!' });
});


// Onboarding API route
app.post('/api/onboard', authenticateToken, async (req, res) => {
  const { name,age,instagram_id,bgmi_id,gender,intrested_game,phoneNumber,image } = req.body;

  if (!name || !phoneNumber) {
    return res.status(400).json({ error: 'Missing name field' });
  }

  try {
    // Assuming req.user.sub contains the user's Google ID (sub is Google's unique identifier for the user)
    const updatedUser = await prisma.user.update({
      where: { email: req.user.email }, // Identify user by email or other unique identifier
      data: {
        name,
        age,instagram_id,bgmi_id,gender,intrested_game,phoneNumber ,image,
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
  const { name, date, entryFees, prize, seatsLeft,gameName,isopen,expired,image } = req.body;

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
        gameName,
        isopen,
        expired,
        image
      },
    });

    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Retrieve a specific event by ID
    const event = await prisma.event.findUnique({
      where: { id: id },
    });

    if (!event) { 
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ event });
  } catch (error) {
    console.error('Error fetching event:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get all events API route
app.get('/api/events', async (req, res) => {
  try {
    // Retrieve all events from the database
    const events = await prisma.event.findMany();
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching events:', error.message);
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

// API route to create a new participant for an event
app.post('/api/events/:eventId/participants', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { captainName, teamName, player1Name, player2Name, player3Name, player4Name, player5Name, email, phoneNumber } = req.body;

  // Validate required fields
  if (!captainName || !teamName || !player1Name || !player2Name || !player3Name || !email || !phoneNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Create the participant
    const newParticipant = await prisma.participant.create({
      data: {
        captainName,
        teamName,
        player1Name,
        player2Name,
        player3Name,
        player4Name,
        player5Name, // This can be null
        email,
        phoneNumber,
        eventId, // Link to the event
      },
    });

    res.status(201).json({ message: 'Participant registered successfully', participant: newParticipant });
  } catch (error) {
    console.error('Error creating participant:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to get all participants for a specific event
app.get('/api/events/:eventId/participants', async (req, res) => {
  const { eventId } = req.params;

  try {
    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get all participants for the event
    const participants = await prisma.participant.findMany({
      where: { eventId: eventId },
    });

    res.status(200).json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,   
  key_secret: process.env.RAZORPAY_APT_SECRET, 
});


// Create Razorpay order
app.post('/api/payment/order', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: 'order_rcptid_11',
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// Verify payment
app.post('/api/payment/verify', (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_APT_SECRET);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === signature) {
    res.json({ message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ error: 'Payment verification failed' });
  }
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
