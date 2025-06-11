import { useEffect, useState } from "react";
import {possibleWords, validWords} from '../wordList'
import './Solver.css'
const initialGrid = () =>Array.from({length: 6}, () => Array.from({length:5}, () => ({letter: '', color: 'gray'})))
const keyboardRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H', 'J','K', 'L'],
    ['Z','X','C','V','B','N','M']
]
const Solver = () => {

    const [grid, setGrid] = useState(initialGrid());
    const [currentRow, setCurrentRow] = useState(0);
    const [currentCol, setCurrentCol] = useState(0);
    const [currentWord, setCurrentWord] = useState('');
    const [message, setMessage] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const cloneGrid = (grid) => grid.map(row => row.map(cell => ({...cell})));

    const handleKeyboardInput = (letter) =>{
        if(currentRow>= 6 || currentCol >= 5)return;
        
        const newGrid = cloneGrid(grid);
        newGrid[currentRow][currentCol].letter = letter;
        setGrid(newGrid);

        setCurrentWord(prev => prev+letter);
        if(currentCol < 4){
            setCurrentCol(currentCol+1);
        }
    };
    const handleEnter = () => {
        if(currentWord.length === 5){
            const topSuggestions = filterSuggestions();
            setSuggestions(topSuggestions);
            setMessage('Suggestions Updated');

            if(currentRow < 5){
                setCurrentRow(currentRow+1);
                setCurrentCol(0);
                setCurrentWord("");
            }
        }else{
            setMessage('Fill full Word before Enter');
        }
    }
    const handleDelete = () => {
        if(currentRow >= 6)return;
        const newGrid = cloneGrid(grid);
        if(newGrid[currentRow][currentCol].letter){
            newGrid[currentRow][currentCol].letter = '';
            setGrid(newGrid);
    
            if(currentWord.length > 0){
                setCurrentWord(prev => prev.slice(0,-1));
            }            
        }else if(currentCol > 0) {
            setCurrentCol(currentCol-1);
            const updateGrid = cloneGrid(newGrid);
            updateGrid[currentRow][currentCol-1].letter = ''
            setGrid(updateGrid);

            if(currentWord.length > 0){
                setCurrentWord(prev => prev.slice(0,-1));
            }
        }
    }

    const filterSuggestions = () => {
        let filtered = [...possibleWords];
        const greenMap = {};
        const yellowMap = {};
        const graySet = new Set();

        for(let r=0; r<= currentRow; r++){
            for(let c = 0; c<currentCol; c++){
                const {letter, color} = grid[r][c];
                if(!letter)continue;
                if(color === 'green'){
                    greenMap[c] = letter;
                }else if(color === 'yellow'){
                    if(!yellowMap[letter] ) yellowMap[letter] = new Set();
                    yellowMap[letter].add(c);
                }else if(color === 'gray'){
                    graySet.add(letter);
                }
            }
        }

        filtered = filtered.filter(word => {
            for(const [idx,ch] of Object.entries(greenMap)){
                if(word[+idx] !== ch)return false;
            }
            for(const [ch, posSet] of Object.entries(yellowMap)){
                if(!word.includes(ch))return false;
                if([...posSet].some(pos => word[pos] ===ch))return false;
            }
            for(const gray of graySet){
                if(!Object.values(greenMap).includes(gray) && !Object.keys(yellowMap).includes(gray)){
                    if(word.includes(gray))return false;
                }
            }
            return true;
        });

        const letterfrequency = {
            e: 13, a:12, r:11, i:10, o:9, t:8, n:7, s:6, l:5, c:4, u:4, d:4, p:4, m:3, h:3, g:2, b:2, f:2, y:2, w:2, k:1, v:1, x:1, z:1, q:1, j:1
        };

        const scoreWord = (word) => {
            const seen = new Set();
            let score = 0;
            for(const ch of word){
                if(!seen.has(ch)){
                    score += (letterfrequency[ch] || 0);
                    seen.add(ch);
                }
            }
            return score;
        };
        filtered.sort((a,b) => scoreWord(b) - scoreWord(a));
        return filtered.slice(0,10);

    }

    const handleSquareClick = (r,c) => { 
        const newGrid = cloneGrid(grid);
        const currentColor = newGrid[r][c].color;
        const nextColor = currentColor === 'gray' ? 'yellow' : currentColor === 'yellow' ? 'green' : 'gray';
        newGrid[r][c].color = nextColor;
        setGrid(newGrid);
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if(key.length ===1 && key >= 'a' && key <= 'z'){
                handleKeyboardInput(key);
            }else if(key === 'backspace'){
                handleDelete();
            }else if(key === 'enter'){
                handleEnter();
            }
        } ;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentRow, currentCol, grid]);
    return (
        <div>
            <div className="container">
                <h1>Wordle Solver</h1>
                <div className="game">
                    <div className="left-panel">
                        <div className="grid">
                            {grid.map((rData, rInd) => (
                                <div key = {rInd} className="row">
                                    {rData.map((cell, cInd) => (
                                        <input
                                        key = {cInd}
                                        className= {`cell ${cell.color} ${currentCol === cInd && currentRow === rInd ? 'active': ''}`}
                                        value = {cell.letter}
                                        readOnly
                                        onClick={() => handleSquareClick(rInd,cInd)}
                                        ></input>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="keyboard">
                            {keyboardRows.map((row,idx) => (
                                <div key = {idx} className="keyboard-row">
                                    {row.map((key) => (
                                        <button 
                                        key = {key}
                                        className="keyboard-key"
                                        onClick={() => handleKeyboardInput(key.toLowerCase())}
                                        > {key}</button>
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
                                <h3 className="suggestion-list">Top Suggestions: </h3>
                                <ul className="suggestion-list">
                                    {suggestions.map((word,idx) => (
                                        <li key = {idx}>{word}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>
                </div>
            </div>

        </div>
    )
}

export default Solver