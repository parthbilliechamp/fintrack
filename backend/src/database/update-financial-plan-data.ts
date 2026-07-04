import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase, disconnectDatabase } from './connection';
import { replaceFinancialPlanData } from './seed-financial-plan';
import logger from '../logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

(async () => {
  try {
    await connectDatabase();
    await replaceFinancialPlanData();
    logger.info('Financial plan update complete');
  } catch (error) {
    logger.error('Financial plan update failed', { error: (error as Error).message });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
})();
