import dotenv from 'dotenv'
dotenv.config();
import mongoose from 'mongoose';
import { addNewPuzzlesToCollection } from './populateValidEnglishWordsCollection.js';

// Usage: node populate-puzzles.js [count]
// Default: generates 100 puzzles. Pass a number as the first argument to generate more/fewer.
const puzzleCount = parseInt(process.argv[2]) || 50;

const runOnce = async () => {
  try {
    const mongoString = process.env.DATABASE_URL;
    console.log('Connecting to:', mongoString);
    
    // WAIT for connection to complete before proceeding
    await mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Check if connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready');
    }
    
    console.log('✅ Database Connected Successfully');
    console.log(`Generating ${puzzleCount} Level 1 puzzles...\n`);
    
    // NOW it's safe to run database operations
    const result = await addNewPuzzlesToCollection(puzzleCount);
    console.log(result.message);
    
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    // Close connection and exit
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
};

// Set up event listeners before connecting
mongoose.connection.on('error', (error) => {
  console.error('Database error:', error);
});

runOnce();