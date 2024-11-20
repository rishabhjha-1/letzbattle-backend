const express = require("express");
const eventRouter=express();
const authenticateToken = require("../middleware/authenticateToken");
const { PrismaClient } = require('@prisma/client');
const prisma = require('../config/prismaClient');
const {transporter}=require('../config/nodemailer');

eventRouter.post("/", authenticateToken, async (req, res) => {
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
    eventType
  } = req.body;

  // Validate required fields
  if (!name || !date || !entryFees || !prize || !seatsLeft) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    // Create the event, associating the current user as the host
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
        hostId: req.user.id, // Associate the event with the authenticated user
        eventType
      },
    });

    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all events created by the authenticated user or all events for admins
eventRouter.get("/my-events", authenticateToken, async (req, res) => {
  try {
    let events;

    if (req.user.role === "ADMIN") {
      // Admins can see all events
      events = await prisma.event.findMany({
        include: {
          Participant: true, // This includes the participants in each event
        },
      });
    } else {
      // Regular users can see only events they have created
      events = await prisma.event.findMany({
        where: { hostId: req.user.id },
        include: {
          Participant: true, // This includes the participants in each event
        },
      });
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

eventRouter.post('/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

 

  // Email options
  let mailOptions = {
    from: 'nexgenbattles.tech@gmail.com',
    to: to,
    subject: subject,
    text: text,
  };

  try {
    // Send email
    let info = await transporter.sendMail(mailOptions);
    res.status(200).send(`Email sent: ${info.response}`);
  } catch (error) {
    res.status(500).send(`Error sending email: ${error}`);
  }
});

eventRouter.post("/send-email-batch", async (req, res) => {
  const { emails, subject, text } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: "Invalid email list" });
  }

  const failedEmails = [];
  const successEmails = [];

  try {
    for (const email of emails) {
      try {
        await transporter.sendMail({
          from: 'nexgenbattles.tech@gmail.com',
          to: email,
          subject,
          text,
        });
        successEmails.push(email);
        await delay(2000);
      } catch (error) {
        if (!successEmails.includes(email)) {
          failedEmails.push(email);
          console.error(`Failed to send email to ${email}:`, error.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Email processing complete.",
      successEmails,
      failedEmails,
    });
  } catch (error) {
    console.error("Error processing email batch:", error);
    res.status(500).json({ success: false, message: "Failed to process email batch." });
  }
});




// Edit an event (only allow the creator or admin to edit)
eventRouter.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
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

  try {
    // Find the event
    const event = await prisma.event.findUnique({
      where: { id: id },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is either the creator of the event or an admin
    if (req.user.id !== event.hostId && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "You do not have permission to edit this event" });
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: {
        name,
        date: new Date(date),
        entryFees,
        prize,
        seatsLeft,
        gameName,
        isopen,
        expired,
        image,
      },
    });

    res.status(200).json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error.message);
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
    const events = await prisma.event.findMany({
      include: {
        Participant: true, // This includes the participants in each event
      },
    });
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
        userId: req.user.id,
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
      select: {
        id: true,
        captainName: true,
        teamName: true,
        player1Name: true,
        player2Name: true,
        player3Name: true,
        player4Name: true,
        player5Name: true,
        email: true,
        phoneNumber: true,
        userId: true,  // Include the userId
      },
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
