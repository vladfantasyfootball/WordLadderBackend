import dotenv from 'dotenv'
dotenv.config();
import mongoose from 'mongoose';
import { addNewPuzzlesToCollection2 } from './populate-level2-puzzles.js';

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
    
    // NOW it's safe to run database operations
    const result = await addNewPuzzlesToCollection2(10);
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