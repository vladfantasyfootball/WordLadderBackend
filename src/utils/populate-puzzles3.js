import dotenv from 'dotenv'
dotenv.config();
import mongoose from 'mongoose';
import { addNewPuzzlesToCollection3 } from './populate-level3-puzzles.js';

// Usage: node populate-puzzles3.js [count]
// Default: generates 10 puzzles. Pass a number as the first argument to generate more.
const puzzleCount = parseInt(process.argv[2]) || 10;

const runOnce = async () => {
  try {
    const mongoString = process.env.DATABASE_URL;
    console.log('Connecting to:', mongoString);

    await mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });

    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready');
    }

    console.log('✅ Database Connected Successfully');
    console.log(`Generating ${puzzleCount} Level 3 puzzles...\n`);

    const result = await addNewPuzzlesToCollection3(puzzleCount);
    console.log(result.message);

  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
};

mongoose.connection.on('error', (error) => {
  console.error('Database error:', error);
});

runOnce();
