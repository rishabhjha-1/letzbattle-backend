const { PrismaClient } = require('@prisma/client');
const { verifyGoogleToken } = require('../services/googleAuthService');
const prisma = require('../config/prismaClient');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const userPayload = await verifyGoogleToken(token);
    if (userPayload) {
      const user = await prisma.user.findUnique({
        where: { email: userPayload.email },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = { ...userPayload, role: user.role };
      next();
    } else {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};

module.exports = authenticateToken;
