/**
 * MongoDB Database Initialization Script
 * 
 * This script initializes the MongoDB database with:
 * - Collection creation with schema validation
 * - Index creation for optimal query performance
 * 
 * Run with: npm run db:init
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance_360';

// Collection schemas with validation
const collectionSchemas = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'email', 'password', 'name'],
        properties: {
          _id: { bsonType: 'string', description: 'Custom string ID' },
          email: { bsonType: 'string', description: 'User email address' },
          password: { bsonType: 'string', description: 'Hashed password' },
          name: { bsonType: 'string', description: 'User display name' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' }
        }
      }
    }
  },
  expenses: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'userId', 'category', 'details', 'date', 'amount'],
        properties: {
          _id: { bsonType: 'string' },
          userId: { bsonType: 'string', description: 'Reference to users._id' },
          category: { 
            enum: ['Dine', 'Grocery', 'Personal'],
            description: 'Expense category'
          },
          details: { bsonType: 'string', description: 'Expense description' },
          date: { bsonType: 'date', description: 'Expense date' },
          amount: { bsonType: 'number', minimum: 0, description: 'Expense amount' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' }
        }
      }
    }
  },
  investments: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'userId', 'accountName', 'accountType', 'investedAmount', 'currentValue'],
        properties: {
          _id: { bsonType: 'string' },
          userId: { bsonType: 'string', description: 'Reference to users._id' },
          accountName: { bsonType: 'string', description: 'Investment account name' },
          accountType: { 
            enum: ['RRSP', 'TFSA', 'FHSA', 'Savings'],
            description: 'Account type'
          },
          investedAmount: { bsonType: 'number', minimum: 0, description: 'Total invested' },
          currentValue: { bsonType: 'number', minimum: 0, description: 'Current value' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' }
        }
      }
    }
  },
  investmenttransactions: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'userId', 'amount', 'date', 'accountId'],
        properties: {
          _id: { bsonType: 'string' },
          userId: { bsonType: 'string', description: 'Reference to users._id' },
          amount: { bsonType: 'number', description: 'Transaction amount (can be negative)' },
          date: { bsonType: 'date', description: 'Transaction date' },
          accountId: { bsonType: 'string', description: 'Reference to investments._id' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' }
        }
      }
    }
  },
  contributionlimits: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'userId', 'year', 'accountType', 'limit'],
        properties: {
          _id: { bsonType: 'string' },
          userId: { bsonType: 'string', description: 'Reference to users._id' },
          year: { bsonType: 'number', minimum: 2000, maximum: 2100, description: 'Year' },
          accountType: { 
            enum: ['RRSP', 'TFSA', 'FHSA'],
            description: 'Account type'
          },
          limit: { bsonType: 'number', minimum: 0, description: 'Contribution limit' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' }
        }
      }
    }
  }
};

// Index definitions
const indexDefinitions: Record<string, Array<{ key: Record<string, 1 | -1>; options: { unique?: boolean; name: string } }>> = {
  users: [
    { key: { email: 1 }, options: { unique: true, name: 'email_unique' } }
  ],
  expenses: [
    { key: { userId: 1 }, options: { name: 'userId' } },
    { key: { userId: 1, date: -1 }, options: { name: 'userId_date' } },
    { key: { userId: 1, category: 1 }, options: { name: 'userId_category' } }
  ],
  investments: [
    { key: { userId: 1 }, options: { name: 'userId' } },
    { key: { userId: 1, accountType: 1 }, options: { name: 'userId_accountType' } }
  ],
  investmenttransactions: [
    { key: { userId: 1 }, options: { name: 'userId' } },
    { key: { userId: 1, date: -1 }, options: { name: 'userId_date' } },
    { key: { accountId: 1, date: -1 }, options: { name: 'accountId_date' } },
    { key: { userId: 1, accountId: 1 }, options: { name: 'userId_accountId' } }
  ],
  contributionlimits: [
    { key: { userId: 1, year: 1 }, options: { name: 'userId_year' } },
    { key: { userId: 1, year: 1, accountType: 1 }, options: { unique: true, name: 'userId_year_accountType_unique' } }
  ]
};

async function initializeDatabase() {
  console.log('🚀 Starting MongoDB database initialization...\n');
  console.log(`📡 Connecting to: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);

    // Create collections with validation
    console.log('📦 Creating collections with schema validation...\n');
    
    for (const [collectionName, schema] of Object.entries(collectionSchemas)) {
      if (existingNames.includes(collectionName)) {
        console.log(`  ⏭️  Collection '${collectionName}' already exists, updating validation...`);
        await db.command({
          collMod: collectionName,
          validator: schema.validator,
          validationLevel: 'moderate'
        });
      } else {
        console.log(`  ✨ Creating collection '${collectionName}'...`);
        await db.createCollection(collectionName, {
          validator: schema.validator,
          validationLevel: 'moderate'
        });
      }
    }

    console.log('\n📇 Creating indexes...\n');

    // Create indexes
    for (const [collectionName, indexes] of Object.entries(indexDefinitions)) {
      const collection = db.collection(collectionName);
      
      for (const index of indexes) {
        try {
          await collection.createIndex(index.key, index.options);
          console.log(`  ✅ Created index '${index.options.name}' on '${collectionName}'`);
        } catch (error: any) {
          if (error.code === 85) {
            console.log(`  ⏭️  Index '${index.options.name}' already exists on '${collectionName}'`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Database initialization complete!\n');

    // Display summary
    console.log('📊 Summary:');
    console.log('─'.repeat(50));
    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  ${coll.name}: ${count} documents`);
    }
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

initializeDatabase();
