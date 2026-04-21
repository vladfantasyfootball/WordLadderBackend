/**
 * Removes Shuffle (Level 2) puzzles that have no anagram move in
 * their shortest solution, and Morph (Level 3) puzzles that:
 *   - have fewer than 2 words longer than 4 letters in the solution, OR
 *   - have a starting or ending word that is >4 letters and ends with 'S'.
 *
 * After removing violations, renumbers remaining puzzles sequentially from 1.
 *
 * Usage:
 *   node src/utils/remove-rule-violating-puzzles.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { LevelTwoPuzzlesModel } from '../models/levelTwoPuzzles.js';
import { LevelThreePuzzlesModel } from '../models/levelThreePuzzles.js';

// ─── Rule helpers ─────────────────────────────────────────────────────────────

/**
 * Returns true if two words are anagrams of each other
 * (same letters, same length, different arrangement).
 */
const isAnagram = (a, b) => {
  if (a.length !== b.length || a === b) return false;
  return a.split('').sort().join('') === b.split('').sort().join('');
};

/**
 * Shuffle rule: the shortest solution must contain at least one
 * consecutive pair of words that are anagrams of each other.
 */
const shuffleHasAnagramMove = (shortestSolution) => {
  for (let i = 0; i < shortestSolution.length - 1; i++) {
    if (isAnagram(
      shortestSolution[i].toLowerCase(),
      shortestSolution[i + 1].toLowerCase()
    )) return true;
  }
  return false;
};

/**
 * Morph rule 1: the solution must contain at least 2 words
 * that are longer than 4 letters.
 */
const morphHasMultipleLongWords = (shortestSolution) => {
  const longWords = shortestSolution.filter(w => w.length > 4);
  return longWords.length >= 2;
};

/**
 * Morph rule 2: if the starting or ending word is longer than 4 letters,
 * it must not end with 'S'.
 */
const morphNoTrailingSOnBoundaryWords = (startingWord, endingWord) => {
  if (startingWord.length > 4 && startingWord.toUpperCase().endsWith('S')) return false;
  if (endingWord.length > 4 && endingWord.toUpperCase().endsWith('S')) return false;
  return true;
};

// ─── Generic clean + reorder ──────────────────────────────────────────────────

const cleanAndReorder = async (Model, levelName, shouldRemove) => {
  const all = await Model.find().sort({ id: 1 });
  console.log(`\n[${levelName}] Found ${all.length} puzzles`);

  const toDelete = all.filter(p => shouldRemove(p));
  console.log(`[${levelName}] Removing ${toDelete.length} rule-violating puzzles:`);
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

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Shuffle: remove puzzles with no anagram move in the solution
    await cleanAndReorder(
      LevelTwoPuzzlesModel,
      'Level 2 (Shuffle)',
      (p) => !shuffleHasAnagramMove(p.shortestSolution)
    );

    // Morph: remove puzzles that violate either morph rule
    await cleanAndReorder(
      LevelThreePuzzlesModel,
      'Level 3 (Morph)',
      (p) =>
        !morphHasMultipleLongWords(p.shortestSolution) ||
        !morphNoTrailingSOnBoundaryWords(p.startingWord, p.endingWord)
    );
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
})();
