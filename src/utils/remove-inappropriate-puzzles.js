/**
 * Removes any puzzle from all three levels where any word in
 * shortestSolution appears in the blockedWords set.
 * Then renumbers remaining puzzles sequentially starting from 1.
 *
 * Usage:
 *   node src/utils/remove-inappropriate-puzzles.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { LevelOnePuzzlesModel } from '../models/levelOnePuzzles.js';
import { LevelTwoPuzzlesModel } from '../models/levelTwoPuzzles.js';
import { LevelThreePuzzlesModel } from '../models/levelThreePuzzles.js';
import { blockedWords } from '../controllers/conciseEnglishWords.js';

const hasBlockedWord = (shortestSolution) =>
  shortestSolution.some(word => blockedWords.has(word.toUpperCase()));

const cleanAndReorder = async (Model, levelName) => {
  const all = await Model.find().sort({ id: 1 });
  console.log(`\n[${levelName}] Found ${all.length} puzzles`);

  const toDelete = all.filter(p => hasBlockedWord(p.shortestSolution));
  console.log(`[${levelName}] Removing ${toDelete.length} inappropriate puzzles:`);
  toDelete.forEach(p =>
    console.log(`  id=${p.id}  ${p.startingWord} → ${p.endingWord}  solution=[${p.shortestSolution.join(', ')}]`)
  );

  if (toDelete.length > 0) {
    await Model.deleteMany({ _id: { $in: toDelete.map(p => p._id) } });
  }

  // Renumber remaining puzzles sequentially
  const remaining = await Model.find().sort({ id: 1 });
  for (let i = 0; i < remaining.length; i++) {
    const newId = i + 1;
    if (remaining[i].id !== newId) {
      await Model.updateOne({ _id: remaining[i]._id }, { $set: { id: newId } });
    }
  }
  console.log(`[${levelName}] ✅ Done — ${remaining.length} puzzles remain, IDs renumbered 1–${remaining.length}`);
};

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    await cleanAndReorder(LevelOnePuzzlesModel, 'Level 1');
    await cleanAndReorder(LevelTwoPuzzlesModel, 'Level 2');
    await cleanAndReorder(LevelThreePuzzlesModel, 'Level 3');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
})();
