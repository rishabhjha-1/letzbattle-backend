

const express = require('express');

const app = express();
const cors = require('cors'); 
const { userRouter } = require('./routes/user');
const { eventRouter } = require('./routes/events');
const {paymentRouter}=require('./routes/payment')




app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is up and running!' });
});



app.use('/api/events',eventRouter);

// Get all events API route

app.use('/api/user',userRouter);
//change api for onboarding in frontend

app.use('/api/payment',paymentRouter)


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
