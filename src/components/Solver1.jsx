import { useEffect, useState } from "react";
import { possibleWords, validWords, firstSuggestionList } from '../wordList';
import './Solver.css';

const initialGrid = () => Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => ({ letter: '', color: 'gray' })));
const keyboardRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const Solver1 = () => {
  const [grid, setGrid] = useState(initialGrid());
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hard, setHard] = useState(false);
  const [reducedWordList, setReducedWordList] = useState([...possibleWords]);
  const [greyLetters, setGreyLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const numToColour = { 2: 'green', 1: 'yellow', 0: 'gray', 3: '' };

  const cloneGrid = (grid) => grid.map(row => row.map(cell => ({ ...cell })));

  const generateAllColourMaps = () => {
    const maps = [];
    let array = [0, 0, 0, 0, 0];
    for (let a = 0; a < 3; a++) {
      array[0] = a;
      for (let b = 0; b < 3; b++) {
        array[1] = b;
        for (let c = 0; c < 3; c++) {
          array[2] = c;
          for (let d = 0; d < 3; d++) {
            array[3] = d;
            for (let e = 0; e < 3; e++) {
              array[4] = e;
              maps.push([...array]);
            }
          }
        }
      }
    }
    return maps;
  };

  const possibleColourMaps = generateAllColourMaps();

  const round = (value, dp) => Math.round(value * (10 ** dp)) / (10 ** dp);

  const entrapyArray = (array) => {
    array = array.filter(num => num !== 0);
    const total = array.reduce((a, b) => a + b, 0);
    array = array.map(num => num / total);
    return array.reduce((total, curr) => total + ((Math.log2(1 / curr)) * curr), 0);
  };

  const createColourMap = (guess, word) => {
    const guessArr = guess.split("");
    const wordArr = word.split("");
    return guessArr.map((letter, index) => {
      if (letter === wordArr[index]) return 2;
      let lettersInWord = wordArr.filter(char => char === letter).length;
      guessArr.slice(0, index).forEach(char => { if (char === letter) lettersInWord--; });
      guessArr.slice(index + 1).forEach((char, i) => {
        if (char === letter && wordArr[i + index + 1] === letter) lettersInWord--;
      });
      return lettersInWord > 0 ? 1 : 0;
    });
  };

  const quickFindRemainingWord = (guess, colourMap, words) => {
    const mapStr = colourMap.join("");
    return words.filter(word => createColourMap(guess, word).join("") === mapStr);
  };

  const makeSuggestionList = (wordList) => {
    const wordsFiltered = wordList.filter(word => possibleWords.includes(word));
    const reducedPossible = possibleWords.filter(word => !word.split('').some(l => greyLetters.includes(l)));
    const workingList = (wordsFiltered.length > 20 && reducedPossible.length >= 1) ? reducedPossible : possibleWords;
    const reducedWorkingList = workingList.slice(0, 200);
    return reducedWorkingList.map((word) => {
      const possibilityFreq = possibleColourMaps.map(cm => quickFindRemainingWord(word, cm, wordsFiltered).length);
      const expectedEntropy = entrapyArray(possibilityFreq);
      return [word, expectedEntropy + (wordsFiltered.includes(word) ? 1 / wordsFiltered.length : 0)];
    }).sort((a, b) => b[1] - a[1]);
  };

  const handleKeyboardInput = (letter) => {
    if (currentRow >= 6 || currentCol >= 5) return;
    const newGrid = cloneGrid(grid);
    newGrid[currentRow][currentCol].letter = letter;
    setGrid(newGrid);
    setCurrentWord(prev => prev + letter);
    if (currentCol < 4) {
      setCurrentCol(currentCol + 1);
    }
  };

  const getColourMapFromGrid = (word, rowIndex) => {
    const colorMap = [];
    for (let i = 0; i < 5; i++) {
      const cell = grid[rowIndex][i];
      if (cell.letter === word[i] && cell.color === 'green') colorMap.push(2);
      else if (cell.color === 'yellow') colorMap.push(1);
      else colorMap.push(0);
    }
    return colorMap;
  };

  const handleEnter = () => {
    if (currentWord.length !== 5) {
      setMessage("Fill full Word before Enter");
      return;
    }

    setIsLoading(true);
    setMessage("Generating Suggestions...");

    const newGreyLetters = [...greyLetters];
    const currentRowData = grid[currentRow];
    const guess = currentRowData.map(cell => cell.letter).join('');
    const colourMap = currentRowData.map(cell => cell.color === 'green' ? 2 : cell.color === 'yellow' ? 1 : 0);

    const newReducedList = reducedWordList.filter(word => createColourMap(guess, word).join("") === colourMap.join(""));
    setReducedWordList(newReducedList);

    const letterFreq = {};
    for (const word of newReducedList) {
      const seen = new Set();
      for (const ch of word) {
        if (!seen.has(ch)) {
          letterFreq[ch] = (letterFreq[ch] || 0) + 1;
          seen.add(ch);
        }
      }
    }

    const scoreWord = word => {
      const seen = new Set();
      return word.split('').reduce((acc, ch) => {
        if (seen.has(ch)) return acc;
        seen.add(ch);
        return acc + (letterFreq[ch] || 0);
      }, 0);
    };

    const sorted = [...newReducedList]
      .map(w => [w, scoreWord(w)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);

    setSuggestions(sorted);
    setIsLoading(false);
    setMessage("Suggestions Updated");

    setCurrentRow(prev => prev + 1);
    setCurrentCol(0);
    setCurrentWord("");
  };


  
  

  const handleDelete = () => {
    if (currentRow >= 6) return;
    const newGrid = cloneGrid(grid);
    if (currentCol > 0) {
      const col = currentCol - 1;
      newGrid[currentRow][col].letter = '';
      setGrid(newGrid);
      setCurrentCol(col);
      setCurrentWord(prev => prev.slice(0, -1));
    }
  };

  const handleSquareClick = (r, c) => {
    const newGrid = cloneGrid(grid);
    const currentColor = newGrid[r][c].color;
    const nextColor = currentColor === 'gray' ? 'yellow' : currentColor === 'yellow' ? 'green' : 'gray';
    newGrid[r][c].color = nextColor;
    setGrid(newGrid);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key.length === 1 && key >= 'a' && key <= 'z') {
        handleKeyboardInput(key);
      } else if (key === 'backspace') {
        handleDelete();
      } else if (key === 'enter') {
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRow, currentCol, grid]);

  return (
    <div className="container">
      <h1>Wordle Solver</h1>
      <div className="game">
        <div className="left-panel">
          <div className="grid">
            {grid.map((rData, rInd) => (
              <div key={rInd} className="row">
                {rData.map((cell, cInd) => (
                  <input
                    key={cInd}
                    className={`cell ${cell.color} ${currentCol === cInd && currentRow === rInd ? 'active' : ''}`}
                    value={cell.letter}
                    readOnly
                    onClick={() => handleSquareClick(rInd, cInd)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="keyboard">
            {keyboardRows.map((row, idx) => (
              <div key={idx} className="keyboard-row">
                {row.map((key) => (
                  <button
                    key={key}
                    className="keyboard-key"
                    onClick={() => handleKeyboardInput(key.toLowerCase())}
                  >{key}</button>
                ))}
              </div>
            ))}
            <div className="keyboard-row">
              <button className="keyboard-key" onClick={handleEnter}>ENTER</button>
              <button className="keyboard-key" onClick={handleDelete}>DELETE</button>
            </div>
          </div>
        </div>
        <div className="right-panel">
          <p>{message}</p>
          {suggestions.length > 0 && (
            <div>
              <h3 className="suggestion-list">Top Suggestions:</h3>
              <ul className="suggestion-list">
                {suggestions.map((word, idx) => (
                  <li key={idx}>{word}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Solver1;
