# MongoDB Database Setup Guide

This document provides instructions for setting up MongoDB for the Personal Finance 360 application.

## Prerequisites

- MongoDB 6.0 or higher installed locally, or access to MongoDB Atlas
- Node.js 18.x or higher

## Option 1: Local MongoDB Setup

### 1. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### 2. Verify Installation
```bash
mongosh --version
mongosh  # Connect to MongoDB shell
```

## Option 2: MongoDB Atlas (Cloud)

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Set up database access (username/password)
4. Add your IP to the network access whitelist
5. Get your connection string from the cluster dashboard

## Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your MongoDB connection string:

**For local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/personal_finance_360
```

**For MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/personal_finance_360?retryWrites=true&w=majority
```

## Database Initialization

The application uses Mongoose, which will automatically create collections when documents are first inserted. However, you can optionally run the initialization script to create collections with proper indexes and validation upfront.

### Run Initialization Script

```bash
cd backend
npm install
npm run db:init
```

This script will:
1. Connect to MongoDB
2. Create all collections with proper schema validation
3. Create necessary indexes for optimal query performance

## Collection Schemas

### Users Collection
```javascript
{
  _id: String,           // Custom ID format: timestamp-randomhash
  email: String,         // Unique, required, lowercase
  password: String,      // Hashed with bcrypt
  name: String,          // Required
  createdAt: Date,
  updatedAt: Date
}
// Indexes: email (unique)
```

### Expenses Collection
```javascript
{
  _id: String,
  userId: String,        // Reference to users._id
  category: String,      // Enum: 'Dine', 'Grocery', 'Personal'
  details: String,
  date: Date,
  amount: Number,        // > 0
  createdAt: Date,
  updatedAt: Date
}
// Indexes: userId, userId+date, userId+category
```

### Investments Collection
```javascript
{
  _id: String,
  userId: String,        // Reference to users._id
  accountName: String,
  accountType: String,   // Enum: 'RRSP', 'TFSA', 'FHSA', 'Savings'
  investedAmount: Number, // >= 0
  currentValue: Number,   // >= 0
  createdAt: Date,
  updatedAt: Date
}
// Indexes: userId, userId+accountType
```

### InvestmentTransactions Collection
```javascript
{
  _id: String,
  userId: String,        // Reference to users._id
  amount: Number,        // != 0
  date: Date,
  accountId: String,     // Reference to investments._id
  createdAt: Date,
  updatedAt: Date
}
// Indexes: userId, userId+date, accountId+date, userId+accountId
```

### ContributionLimits Collection
```javascript
{
  _id: String,
  userId: String,        // Reference to users._id
  year: Number,          // 2000-2100
  accountType: String,   // Enum: 'RRSP', 'TFSA', 'FHSA'
  limit: Number,         // >= 0
  createdAt: Date,
  updatedAt: Date
}
// Indexes: userId+year, userId+year+accountType (unique)
```

## Manual Database Setup (Alternative)

If you prefer to set up the database manually using MongoDB shell:

```javascript
// Connect to MongoDB
mongosh

// Create and switch to database
use personal_finance_360

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "email", "password", "name"],
      properties: {
        _id: { bsonType: "string" },
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        name: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("expenses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "userId", "category", "details", "date", "amount"],
      properties: {
        _id: { bsonType: "string" },
        userId: { bsonType: "string" },
        category: { enum: ["Dine", "Grocery", "Personal"] },
        details: { bsonType: "string" },
        date: { bsonType: "date" },
        amount: { bsonType: "number", minimum: 0 }
      }
    }
  }
});

db.createCollection("investments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "userId", "accountName", "accountType", "investedAmount", "currentValue"],
      properties: {
        _id: { bsonType: "string" },
        userId: { bsonType: "string" },
        accountName: { bsonType: "string" },
        accountType: { enum: ["RRSP", "TFSA", "FHSA", "Savings"] },
        investedAmount: { bsonType: "number", minimum: 0 },
        currentValue: { bsonType: "number", minimum: 0 }
      }
    }
  }
});

db.createCollection("investmenttransactions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "userId", "amount", "date", "accountId"],
      properties: {
        _id: { bsonType: "string" },
        userId: { bsonType: "string" },
        amount: { bsonType: "number" },
        date: { bsonType: "date" },
        accountId: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("contributionlimits", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "userId", "year", "accountType", "limit"],
      properties: {
        _id: { bsonType: "string" },
        userId: { bsonType: "string" },
        year: { bsonType: "number", minimum: 2000, maximum: 2100 },
        accountType: { enum: ["RRSP", "TFSA", "FHSA"] },
        limit: { bsonType: "number", minimum: 0 }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.expenses.createIndex({ userId: 1 });
db.expenses.createIndex({ userId: 1, date: -1 });
db.expenses.createIndex({ userId: 1, category: 1 });
db.investments.createIndex({ userId: 1 });
db.investments.createIndex({ userId: 1, accountType: 1 });
db.investmenttransactions.createIndex({ userId: 1 });
db.investmenttransactions.createIndex({ userId: 1, date: -1 });
db.investmenttransactions.createIndex({ accountId: 1, date: -1 });
db.investmenttransactions.createIndex({ userId: 1, accountId: 1 });
db.contributionlimits.createIndex({ userId: 1, year: 1 });
db.contributionlimits.createIndex({ userId: 1, year: 1, accountType: 1 }, { unique: true });

// Verify collections
show collections
```

## Data Migration (Optional)

If you have existing data in JSON files that you want to migrate to MongoDB, you can use the migration script:

```bash
npm run db:migrate
```

This will:
1. Read data from the `data/` directory JSON files
2. Insert the data into MongoDB collections
3. Hash existing plain-text passwords

**Note:** The migration script is designed to be run once. Running it multiple times may cause duplicate data issues.

## Troubleshooting

### Connection Issues
- Verify MongoDB is running: `brew services list` (macOS) or `systemctl status mongod` (Linux)
- Check connection string format
- For Atlas: verify IP whitelist and credentials

### Permission Issues
- Ensure the MongoDB user has readWrite permissions on the database

### Index Issues
- If you see duplicate key errors, check for existing data that violates unique constraints

## Security Notes

1. **Never commit `.env` files** - They contain sensitive connection strings
2. **Use strong passwords** - Especially for production MongoDB instances
3. **Enable authentication** - In production, always require authentication
4. **Use TLS/SSL** - For Atlas connections, TLS is enabled by default
5. **Password Hashing** - User passwords are now hashed with bcrypt (10 rounds)
