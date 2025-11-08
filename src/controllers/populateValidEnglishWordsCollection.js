import { LevelOnePuzzlesModel } from '../models/levelOnePuzzles.js';
import {englishWords} from './mydictionary.js';

const findWordLadderBidirectional = (startWord, endWord, maxDepth = 10) => {
    startWord = startWord.toUpperCase().trim();
    endWord = endWord.toUpperCase().trim();
    
    if (startWord.length !== endWord.length) {
      return { possible: false, path: null, steps: 0 };
    }
    
    if (startWord === endWord) {
      return { possible: true, path: [startWord], steps: 0 };
    }
    
    // Two-ended search
    const forwardQueue = [startWord];
    const backwardQueue = [endWord];
    const forwardVisited = new Set([startWord]);
    const backwardVisited = new Set([endWord]);
    const forwardParents = new Map();
    const backwardParents = new Map();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    let depth = 0;
    
    while ((forwardQueue.length > 0 || backwardQueue.length > 0) && depth < maxDepth) {
      depth++;
      
      // Always expand the smaller frontier
      const expandForward = forwardQueue.length <= backwardQueue.length;
      const currentQueue = expandForward ? forwardQueue : backwardQueue;
      const currentVisited = expandForward ? forwardVisited : backwardVisited;
      const currentParents = expandForward ? forwardParents : backwardParents;
      const otherVisited = expandForward ? backwardVisited : forwardVisited;
      const otherParents = expandForward ? backwardParents : forwardParents;
      
      const levelSize = currentQueue.length;
      
      for (let i = 0; i < levelSize; i++) {
        const currentWord = currentQueue.shift();
        
        for (let pos = 0; pos < currentWord.length; pos++) {
          for (const letter of alphabet) {
            if (letter === currentWord[pos]) continue;
            
            const newWord = currentWord.slice(0, pos) + letter + currentWord.slice(pos + 1);
            
            // Skip if we've already visited this word in the current direction
            if (currentVisited.has(newWord)) continue;
            
            // Check if this word is valid using the englishWords Set
            if (!englishWords.has(newWord)) continue;
            
            // Check if we've met the other search
            if (otherVisited.has(newWord)) {
              // Found meeting point! Build the complete path
              let forwardPath, backwardPath;
              
              if (expandForward) {
                // We were expanding forward and found a word the backward search has seen
                forwardPath = reconstructPath(forwardParents, startWord, currentWord);
                forwardPath.push(newWord); // Add the meeting point
                backwardPath = reconstructPath(backwardParents, endWord, newWord);
                backwardPath.reverse();
                backwardPath.shift(); // Remove duplicate meeting point
                
                const fullPath = forwardPath.concat(backwardPath);
                
                if (fullPath.length - 1 <= maxDepth) {
                  return { possible: true, path: fullPath, steps: fullPath.length - 1 };
                }
              } else {
                // We were expanding backward and found a word the forward search has seen
                forwardPath = reconstructPath(forwardParents, startWord, newWord);
                backwardPath = reconstructPath(backwardParents, endWord, currentWord);
                backwardPath.push(newWord); // Add the meeting point
                backwardPath.reverse();
                backwardPath.shift(); // Remove duplicate meeting point
                
                const fullPath = forwardPath.concat(backwardPath);
                
                if (fullPath.length - 1 <= maxDepth) {
                  return { possible: true, path: fullPath, steps: fullPath.length - 1 };
                }
              }
            }
            
            // Add to current search
            currentVisited.add(newWord);
            currentParents.set(newWord, currentWord);
            currentQueue.push(newWord);
          }
        }
      }
      
      if (depth >= maxDepth) {
        break;
      }
    }
    
    return { possible: false, path: null, steps: 0 };
  };
  
  const reconstructPath = (parents, startWord, endWord) => {
    const path = [];
    let current = endWord;
    
    while (current !== startWord) {
      path.unshift(current);
      current = parents.get(current);
      if (!current) break; // Safety check
    }
    path.unshift(startWord);
    
    return path;
  };

export function getRandomWord(options = {}) {
    const { minLength, maxLength, startsWith, endsWith } = options;
    
    let filteredWords = Array.from(englishWords);
    
    // Apply filters if specified
    if (minLength || maxLength) {
      filteredWords = filteredWords.filter(word => {
        const len = word.length;
        return (!minLength || len >= minLength) && (!maxLength || len <= maxLength);
      });
    }
    
    if (startsWith) {
      filteredWords = filteredWords.filter(word => word.startsWith(startsWith));
    }
    
    if (endsWith) {
      filteredWords = filteredWords.filter(word => word.endsWith(endsWith));
    }
    
    if (filteredWords.length === 0) {
      throw new Error('No words match the specified criteria');
    }
    
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    return filteredWords[randomIndex];
  }

  export const addNewPuzzlesToCollection = async (puzzleCount = 10) => {
    try {
      console.log('Starting puzzle generation...');
      
      // Find the highest existing ID to continue from
      const lastPuzzle = await LevelOnePuzzlesModel.findOne().sort({ id: -1 });
      const startingId = lastPuzzle ? lastPuzzle.id + 1 : 1;
      
      // Generate puzzles with custom starting ID
      const puzzles = generateRandomPuzzles(puzzleCount, startingId);
      console.log(`Generated ${puzzles.length} puzzles starting from ID ${startingId}`);
      
      // Insert new puzzles
      const result = await LevelOnePuzzlesModel.insertMany(puzzles);
      console.log(`Successfully added ${result.length} new puzzles to database`);
      
      return {
        success: true,
        count: result.length,
        startingId,
        message: `Successfully added ${result.length} puzzles starting from ID ${startingId}`
      };
      
    } catch (error) {
      console.error('Error adding puzzles:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add puzzles to database'
      };
    }
   };
   
   // Updated generateRandomPuzzles to accept custom starting ID
   const generateRandomPuzzles = (targetCount = 10, startingId = 1) => {
    const puzzles = [];
    const used = new Set();
    let currentId = startingId;
    
    while (puzzles.length < targetCount) {
      const start = getRandomWord(
        {minLength: 4, maxLength: 4}
      );
      const end = getRandomWord(        
        {minLength: 4, maxLength: 4}
      );
      console.log('trying:' , start, end)
      const key = `${start}-${end}`;
      
      if (start !== end && !used.has(key) && start.length === end.length) {
        const result = findWordLadderBidirectional(start, end);
        
        if (result.possible && result.steps >= 5 && result.steps <= 10) {
          puzzles.push({
            id: currentId++,
            startingWord: start,
            endingWord: end,
            shortestSolution: result.path
          });
          used.add(key);
          used.add(`${end}-${start}`);
        }
      }
    }
    
    return puzzles;
   };