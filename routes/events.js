const express = require("express");
const eventRouter=express();
const authenticateToken = require("../middleware/authenticateToken");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

eventRouter.post("/",authenticateToken, async (req, res) => {
  const {
    name,
    date,
    entryFees,
    prize,
    seatsLeft,
    gameName,
    isopen,
    expired,
    image,
  } = req.body;

  // Check if the authenticated user is an admin
  if (req.user && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can create events" });
  }

  // Validate required fields
  if (!name || !date || !entryFees || !prize || !seatsLeft) {
    return res.status(400).json({ error: "Missing required fields" });
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
        image,
      },
    });

    res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

eventRouter.get('/:id', async (req, res) => {
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


eventRouter.get('/', async (req, res) => {
  try {
    // Retrieve all events from the database
    const events = await prisma.event.findMany();
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});



eventRouter.post('/:eventId/participants', authenticateToken, async (req, res) => {
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
})

eventRouter.get('/:eventId/participants',authenticateToken, async (req, res) => {
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
})

module.exports = {
  eventRouter: eventRouter,
};
