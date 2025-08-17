/**
 * Finds the shortest word ladder between two words
 * @param {string} startWord - The starting word
 * @param {string} endWord - The target word
 * @param {function} isValidWord - Function that returns true if a word is valid
 * @returns {object} - {possible: boolean, path: string[] | null, steps: number}
 */
function findWordLadder(startWord, endWord, isValidWord) {
    // Normalize inputs
    startWord = startWord.toLowerCase().trim();
    endWord = endWord.toLowerCase().trim();
    
    // Basic validation
    if (startWord.length !== endWord.length) {
      return { possible: false, path: null, steps: 0 };
    }
    
    if (startWord === endWord) {
      return { possible: true, path: [startWord], steps: 0 };
    }
    
    if (!isValidWord(startWord) || !isValidWord(endWord)) {
      return { possible: false, path: null, steps: 0 };
    }
    
    // BFS setup
    const queue = [[startWord]]; // Each element is a path (array of words)
    const visited = new Set([startWord]);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    
    while (queue.length > 0) {
      const currentPath = queue.shift();
      const currentWord = currentPath[currentPath.length - 1];
      
      // Try changing each letter position
      for (let i = 0; i < currentWord.length; i++) {
        // Try each letter of the alphabet
        for (const letter of alphabet) {
          if (letter === currentWord[i]) continue; // Skip same letter
          
          // Create new word by changing one letter
          const newWord = currentWord.slice(0, i) + letter + currentWord.slice(i + 1);
          
          // Check if we reached the target
          if (newWord === endWord) {
            const finalPath = [...currentPath, newWord];
            return {
              possible: true,
              path: finalPath,
              steps: finalPath.length - 1
            };
          }
          
          // If it's a valid word we haven't visited, add to queue
          if (!visited.has(newWord) && isValidWord(newWord)) {
            visited.add(newWord);
            queue.push([...currentPath, newWord]);
          }
        }
      }
    }
    
    // No path found
    return { possible: false, path: null, steps: 0 };
  }