const nodemailer=require('nodemailer')
let transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other email services too
    auth: {
      user: 'nexgenbattles.tech@gmail.com', // Your email address
      pass: process.env.EMAIL_PASS  // Your email password or app password
    }
  });
  module.exports={
    transporter
  }