/**
 * Data Migration Script
 * 
 * Migrates existing JSON data to MongoDB
 * 
 * Run with: npm run db:migrate
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User, Expense, Investment, InvestmentTransaction, ContributionLimit } from './models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance_360';
const DATA_DIR = path.join(process.cwd(), 'data');

interface JsonUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

interface JsonExpense {
  id: string;
  userId: string;
  category: string;
  details: string;
  date: string;
  amount: number;
}

interface JsonInvestment {
  id: string;
  userId: string;
  accountName: string;
  accountType: string;
  investedAmount: number;
  currentValue: number;
}

interface JsonTransaction {
  id: string;
  userId: string;
  amount: number;
  date: string;
  accountId: string;
}

interface JsonContributionLimit {
  id: string;
  userId: string;
  year: number;
  accountType: string;
  limit: number;
}

function readJsonFile<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filename}`);
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

async function migrateUsers(): Promise<number> {
  console.log('\n👤 Migrating users...');
  const users = readJsonFile<JsonUser>('users.json');
  let migrated = 0;

  for (const user of users) {
    try {
      // Check if user already exists
      const existing = await User.findOne({ email: user.email.toLowerCase() });
      if (existing) {
        console.log(`  ⏭️  User '${user.email}' already exists, skipping`);
        continue;
      }

      // Hash the password if it's not already hashed
      const isAlreadyHashed = user.password.startsWith('$2');
      const hashedPassword = isAlreadyHashed 
        ? user.password 
        : await bcrypt.hash(user.password, 10);

      const newUser = new User({
        _id: user.id,
        email: user.email.toLowerCase(),
        password: hashedPassword,
        name: user.name
      });
      
      // Skip the pre-save hook for hashing since we already handled it
      await newUser.save({ validateBeforeSave: true });
      console.log(`  ✅ Migrated user: ${user.email}`);
      migrated++;
    } catch (error: any) {
      console.log(`  ❌ Error migrating user '${user.email}': ${error.message}`);
    }
  }

  return migrated;
}

async function migrateExpenses(): Promise<number> {
  console.log('\n💰 Migrating expenses...');
  const expenses = readJsonFile<JsonExpense>('expenses.json');
  let migrated = 0;

  for (const expense of expenses) {
    try {
      const existing = await Expense.findById(expense.id);
      if (existing) {
        console.log(`  ⏭️  Expense '${expense.id}' already exists, skipping`);
        continue;
      }

      const newExpense = new Expense({
        _id: expense.id,
        userId: expense.userId,
        category: expense.category,
        details: expense.details,
        date: new Date(expense.date),
        amount: expense.amount
      });
      await newExpense.save();
      migrated++;
    } catch (error: any) {
      console.log(`  ❌ Error migrating expense '${expense.id}': ${error.message}`);
    }
  }

  console.log(`  ✅ Migrated ${migrated} expenses`);
  return migrated;
}

async function migrateInvestments(): Promise<number> {
  console.log('\n📈 Migrating investments...');
  const investments = readJsonFile<JsonInvestment>('investments.json');
  let migrated = 0;

  for (const investment of investments) {
    try {
      const existing = await Investment.findById(investment.id);
      if (existing) {
        console.log(`  ⏭️  Investment '${investment.id}' already exists, skipping`);
        continue;
      }

      const newInvestment = new Investment({
        _id: investment.id,
        userId: investment.userId,
        accountName: investment.accountName,
        accountType: investment.accountType,
        investedAmount: investment.investedAmount,
        currentValue: investment.currentValue
      });
      await newInvestment.save();
      migrated++;
    } catch (error: any) {
      console.log(`  ❌ Error migrating investment '${investment.id}': ${error.message}`);
    }
  }

  console.log(`  ✅ Migrated ${migrated} investments`);
  return migrated;
}

async function migrateTransactions(): Promise<number> {
  console.log('\n💸 Migrating investment transactions...');
  const transactions = readJsonFile<JsonTransaction>('investmentTransactions.json');
  let migrated = 0;

  for (const transaction of transactions) {
    try {
      const existing = await InvestmentTransaction.findById(transaction.id);
      if (existing) {
        console.log(`  ⏭️  Transaction '${transaction.id}' already exists, skipping`);
        continue;
      }

      const newTransaction = new InvestmentTransaction({
        _id: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        date: new Date(transaction.date),
        accountId: transaction.accountId
      });
      await newTransaction.save();
      migrated++;
    } catch (error: any) {
      console.log(`  ❌ Error migrating transaction '${transaction.id}': ${error.message}`);
    }
  }

  console.log(`  ✅ Migrated ${migrated} transactions`);
  return migrated;
}

async function migrateContributionLimits(): Promise<number> {
  console.log('\n🎯 Migrating contribution limits...');
  const limits = readJsonFile<JsonContributionLimit>('contributionLimits.json');
  let migrated = 0;

  for (const limit of limits) {
    try {
      const existing = await ContributionLimit.findById(limit.id);
      if (existing) {
        console.log(`  ⏭️  Contribution limit '${limit.id}' already exists, skipping`);
        continue;
      }

      const newLimit = new ContributionLimit({
        _id: limit.id,
        userId: limit.userId,
        year: limit.year,
        accountType: limit.accountType,
        limit: limit.limit
      });
      await newLimit.save();
      migrated++;
    } catch (error: any) {
      console.log(`  ❌ Error migrating contribution limit '${limit.id}': ${error.message}`);
    }
  }

  console.log(`  ✅ Migrated ${migrated} contribution limits`);
  return migrated;
}

async function migrate() {
  console.log('🚀 Starting data migration from JSON to MongoDB...\n');
  console.log(`📡 Connecting to: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`📂 Data directory: ${DATA_DIR}\n`);

  if (!fs.existsSync(DATA_DIR)) {
    console.log('❌ Data directory not found. Nothing to migrate.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const results = {
      users: await migrateUsers(),
      expenses: await migrateExpenses(),
      investments: await migrateInvestments(),
      transactions: await migrateTransactions(),
      contributionLimits: await migrateContributionLimits()
    };

    console.log('\n' + '═'.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('─'.repeat(50));
    console.log(`  Users:               ${results.users}`);
    console.log(`  Expenses:            ${results.expenses}`);
    console.log(`  Investments:         ${results.investments}`);
    console.log(`  Transactions:        ${results.transactions}`);
    console.log(`  Contribution Limits: ${results.contributionLimits}`);
    console.log('═'.repeat(50));
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

migrate();
