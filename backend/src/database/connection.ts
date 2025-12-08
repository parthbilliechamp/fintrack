import mongoose from 'mongoose';
import logger from '../logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance_360';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: (error as Error).message });
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

export default mongoose;
