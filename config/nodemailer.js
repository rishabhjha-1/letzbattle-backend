const nodemailer=require('nodemailer')
let transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other email services too
    auth: {
      user: 'nexgenbattles.tech@gmail.com', // Your email address
      pass: process.env.EMAIL_PASS  // Your email password or app password
    },
    secure: true, // Use TLS (SSL)
    tls: {
        rejectUnauthorized: false, // Allow self-signed certificates if needed
    },
    pool: true,
    maxConnections: 5, // Restrict simultaneous connections
    rateLimit: 2, 
  });
  module.exports={
    transporter
  }