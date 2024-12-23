const authenticateToken=require('../middleware/authenticateToken');
const express=require('express');
const { PrismaClient } = require('@prisma/client');
const userRouter=express();
const prisma = require('../config/prismaClient');

userRouter.get('/',authenticateToken,async (req, res) => {
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
})
userRouter.post('/onboard', authenticateToken, async (req, res) => {
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
})
userRouter.post('/subscribed',authenticateToken,async(req,res)=>{
  try{
    const user=await prisma.user.findUnique({
      where:{
        id:req.user.id
      }
    })
    if(!user){
      return res.status(404).json({error:"User not found"})
    }
    const updatedUser= await prisma.user.update({
      where:{
        id:req.user.id
      },
      data:{
        subscribed:true,
        subscribedDate: new Date()
      }
    })
    res.status(200).json({message:"User subscribed successfully",user:updatedUser})
  }catch(err){
    console.error(err)
  }
})
userRouter.put('/',authenticateToken,async(req,res)=>{
  const data = req.body
  try{
    const user=await prisma.user.findUnique({
      where:{
        id:req.user.id
      }
    })
    if(!user){
      return res.status(404).json({error:"User not found"})

    }
   const updatedUser= await prisma.user.update({
      where:{
        id:req.user.id
      },
      data:{
        ...data
      }
    })
    res.status(200).json({message:"User updated successfully",user:updatedUser})

  }catch(err){
    console.error(err)
  }
})

userRouter.post('/contact',async(req,res)=>{
  const {name,email,message}=req.body;
  if(!name || !email || !message){
    return res.status(404).json('missing attributes')
  }
  try{
   const contact= await prisma.contact.create({
      data:{
        name,
        email,
        message
      }
    })
    res.status(201).json({message:"Contact created successfully",contact:contact})
  }
  catch(err){
    console.error(err)
  }

})
module.exports={
    userRouter:userRouter
}