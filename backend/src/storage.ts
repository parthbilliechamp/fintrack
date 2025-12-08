import fs from 'fs';
import path from 'path';

// Use process.cwd() to get the project root, then navigate to data folder
const DATA_DIR = path.join(process.cwd(), 'data');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const INVESTMENTS_FILE = path.join(DATA_DIR, 'investments.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONTRIBUTION_LIMITS_FILE = path.join(DATA_DIR, 'contributionLimits.json');
const INVESTMENT_TRANSACTIONS_FILE = path.join(DATA_DIR, 'investmentTransactions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize default data files if they don't exist
const initializeDataFiles = () => {
  if (!fs.existsSync(EXPENSES_FILE)) {
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(INVESTMENTS_FILE)) {
    fs.writeFileSync(INVESTMENTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CONTRIBUTION_LIMITS_FILE)) {
    fs.writeFileSync(CONTRIBUTION_LIMITS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(INVESTMENT_TRANSACTIONS_FILE)) {
    fs.writeFileSync(INVESTMENT_TRANSACTIONS_FILE, JSON.stringify([], null, 2));
  }
};

// Read data from JSON file
export const readData = (fileName: string): any[] => {
  try {
    const filePath = path.join(DATA_DIR, `${fileName}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${fileName}.json:`, error);
    return [];
  }
};

// Write data to JSON file
export const writeData = (fileName: string, data: any[]): void => {
  try {
    const filePath = path.join(DATA_DIR, `${fileName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${fileName}.json:`, error);
  }
};

// Append a new item to data file
export const appendData = (fileName: string, item: any): any => {
  const data = readData(fileName);
  // Use more robust ID generation: timestamp + random hash
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newItem = {
    ...item,
    id: uniqueId
  };
  data.push(newItem);
  writeData(fileName, data);
  return newItem;
};

// Update an existing item
export const updateData = (fileName: string, id: string, updates: any): any => {
  const data = readData(fileName);
  const index = data.findIndex((item: any) => item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updates };
    writeData(fileName, data);
    return data[index];
  }
  throw new Error(`Item with id ${id} not found in ${fileName}`);
};

// Delete an item
export const deleteData = (fileName: string, id: string): void => {
  const data = readData(fileName);
  const filteredData = data.filter((item: any) => item.id !== id);
  writeData(fileName, filteredData);
};

// Get item by id
export const getDataById = (fileName: string, id: string): any => {
  const data = readData(fileName);
  return data.find((item: any) => item.id === id);
};

// Initialize on module load
initializeDataFiles();
