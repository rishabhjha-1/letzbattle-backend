const nodemailer=require('nodemailer')
let transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other email services too
    auth: {
      user: 'letzbattle.tech@gmail.com', // Your email address
      pass: ''   // Your email password or app password
    }
  });
  module.exports={
    transporter
  }