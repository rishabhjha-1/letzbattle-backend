const express = require("express");
const paymentRouter=express();
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,   
    key_secret: process.env.RAZORPAY_APT_SECRET, 
  });
  

// Create Razorpay order
paymentRouter.post('/order', async (req, res) => {
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
})

// Verify payment
paymentRouter.post('/verify', (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_APT_SECRET);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === signature) {
    res.json({ message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ error: 'Payment verification failed' });
  }
})

module.exports={
    paymentRouter:paymentRouter
}