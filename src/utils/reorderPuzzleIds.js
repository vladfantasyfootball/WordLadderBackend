import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { LevelOnePuzzlesModel } from '../models/levelOnePuzzles.js'; 
import { LevelTwoPuzzlesModel } from '../models/levelTwoPuzzles.js'; 

const reorderPuzzleOneIds = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const mongoString = process.env.DATABASE_URL;
    await mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready');
    }
    console.log('✅ Connected to MongoDB');
    
    // Fetch all puzzles sorted by their current id
    console.log('\nFetching all puzzles...');
    const puzzles = await LevelOnePuzzlesModel.find().sort({ id: 1 });
    console.log(`Found ${puzzles.length} puzzles`);
    
    if (puzzles.length === 0) {
      console.log('No puzzles to reorder.');
      return;
    }
    
    console.log('\nReordering puzzle IDs...');
    
    // Update each puzzle with new sequential ID
    for (let i = 0; i < puzzles.length; i++) {
      const newId = i + 1;
      const puzzle = puzzles[i];
      
      if (puzzle.id !== newId) {
        await LevelOnePuzzlesModel.updateOne(
          { _id: puzzle._id },
          { $set: { id: newId } }
        );
        console.log(`Updated puzzle: ${puzzle.startingWord} → ${puzzle.endingWord} (old id: ${puzzle.id}, new id: ${newId})`);
      }
    }
    
    console.log('\n✅ Successfully reordered all puzzle IDs!');
    console.log(`Puzzles now numbered from 1 to ${puzzles.length}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
};

const reorderPuzzleTwoIds = async () => {
    try {
      console.log('Connecting to MongoDB...');
      const mongoString = process.env.DATABASE_URL;
      await mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });
      
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection not ready');
      }
      console.log('✅ Connected to MongoDB');
      
      // Fetch all puzzles sorted by their current id
      console.log('\nFetching all puzzles...');
      const puzzles = await LevelTwoPuzzlesModel.find().sort({ id: 1 });
      console.log(`Found ${puzzles.length} puzzles`);
      
      if (puzzles.length === 0) {
        console.log('No puzzles to reorder.');
        return;
      }
      
      console.log('\nReordering puzzle IDs...');
      
      // Update each puzzle with new sequential ID
      for (let i = 0; i < puzzles.length; i++) {
        const newId = i + 1;
        const puzzle = puzzles[i];
        
        if (puzzle.id !== newId) {
          await LevelTwoPuzzlesModel.updateOne(
            { _id: puzzle._id },
            { $set: { id: newId } }
          );
          console.log(`Updated puzzle: ${puzzle.startingWord} → ${puzzle.endingWord} (old id: ${puzzle.id}, new id: ${newId})`);
        }
      }
      
      console.log('\n✅ Successfully reordered all puzzle IDs!');
      console.log(`Puzzles now numbered from 1 to ${puzzles.length}`);
      
    } catch (error) {
      console.error('❌ Script failed:', error);
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('Database connection closed');
      }
    }
  };

// Run the script
await reorderPuzzleOneIds();
await reorderPuzzleTwoIds();