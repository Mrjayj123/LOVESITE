import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './ChessPuzzle.css';

const BULLETPROOF_FEN = "6rk/5Qpp/7P/4N3/8/8/8/6K1 w - - 0 1";

const EXPLICIT_SOLUTION = [
  { white: { from: 'h6', to: 'g7' }, black: { from: 'g8', to: 'g7' } }, 
  { white: { from: 'f7', to: 'c4' }, black: { from: 'h8', to: 'g8' } }, 
  { white: { from: 'c4', to: 'g8' }, black: { from: 'g7', to: 'g8' } }, 
  { white: { from: 'e5', to: 'f7' }, black: null }                    
];

const HINTS = [
  "Clear the way! Capture the g7 pawn to crack open their defense.",
  "Check the King from afar with your Queen to force him back into the corner.",
  "Be brave! Sacrifice your Queen on g8 to trap the enemy King inside his own walls.",
  "Deliver the final blow! Move your Knight to f7 for a beautiful smothered checkmate. 💖",
];

// High contrast pieces matching the request
const PIECES = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
};

const ROWS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function ChessPuzzle({ onSolved }) {
  const [game, setGame] = useState(() => {
    const g = new Chess();
    g.load(BULLETPROOF_FEN);
    return g;
  });
  const [moveIndex, setMoveIndex] = useState(0);
  const [statusText, setStatusText] = useState("White to move — find the checkmate in 4 moves!");
  const [statusClass, setStatusClass] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [waitingForBlack, setWaitingForBlack] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getPieceDetails = (square) => {
    const piece = game.get(square);
    if (!piece) return null;
    let key = piece.type === 'knight' ? 'n' : piece.type;
    key = piece.color === 'w' ? key.toUpperCase() : key;
    return { symbol: PIECES[key] || '', color: piece.color };
  };

  const getLegalMovesForSquare = useCallback((square) => {
    const piece = game.get(square);
    if (!piece || piece.color !== 'w') return [];
    const moves = game.moves({ verbose: true });
    return moves.filter(m => m.from === square).map(m => m.to);
  }, [game]);

  const onSquareClick = (square) => {
    if (solved || waitingForBlack) return;

    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === 'w') {
        const moves = getLegalMovesForSquare(square);
        if (moves.length) {
          setSelectedSquare(square);
          setLegalMoves(moves);
          setStatusText("Selected piece. Click an open square.");
          setStatusClass('');
        }
      }
      return;
    }

    const from = selectedSquare;
    const to = square;
    if (legalMoves.includes(to)) {
      const expected = EXPLICIT_SOLUTION[moveIndex]?.white;
      if (from === expected.from && to === expected.to) {
        try {
          const gameCopy = new Chess(game.fen());
          const move = gameCopy.move({ from, to, promotion: 'q' });
          if (move) {
            setGame(gameCopy);
            setSelectedSquare(null);
            setLegalMoves([]);
            setStatusText("Good move! ✨");
            setStatusClass('');

            if (gameCopy.isCheckmate() || moveIndex === EXPLICIT_SOLUTION.length - 1) {
              setSolved(true);
              setStatusText("Checkmate! Room unlocked. 💖");
              setStatusClass('success');
              if (onSolved) timeoutRef.current = setTimeout(() => onSolved(), 3000);
              return;
            }

            const nextMoveIndex = moveIndex + 1;
            setMoveIndex(nextMoveIndex);

            if (nextMoveIndex < EXPLICIT_SOLUTION.length && EXPLICIT_SOLUTION[moveIndex]?.black) {
              setWaitingForBlack(true);
              timeoutRef.current = setTimeout(() => {
                const blackMove = EXPLICIT_SOLUTION[moveIndex]?.black;
                if (blackMove) {
                  const afterWhite = new Chess(gameCopy.fen());
                  const blackResult = afterWhite.move(blackMove);
                  if (blackResult) {
                    setGame(afterWhite);
                    const remaining = EXPLICIT_SOLUTION.length - nextMoveIndex;
                    setStatusText(remaining > 0 ? `Move ${nextMoveIndex + 1} of ${EXPLICIT_SOLUTION.length} — Your turn!` : "Almost there...");
                  }
                }
                setWaitingForBlack(false);
              }, 600);
            }
          }
        } catch (err) {
          setStatusText("Invalid move. Try again.");
          setStatusClass('error');
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      } else {
        setStatusText(`Not correct. Try finding a different sequence!`);
        setStatusClass('error');
        setSelectedSquare(null);
        setLegalMoves([]);
        timeoutRef.current = setTimeout(() => {
          setStatusText(`Move ${moveIndex + 1} of ${EXPLICIT_SOLUTION.length} — Your turn!`);
          setStatusClass('');
        }, 2000);
      }
    } else {
      setStatusText("Not a legal destination.");
      setStatusClass('error');
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleHint = () => {
    setShowHint(true);
    const expected = EXPLICIT_SOLUTION[moveIndex]?.white;
    if (expected) {
      setStatusText(`Hint: Move ${expected.from.toUpperCase()} → ${expected.to.toUpperCase()}`);
      timeoutRef.current = setTimeout(() => {
        if (!solved) setStatusText(`Move ${moveIndex + 1} of ${EXPLICIT_SOLUTION.length} — Your turn!`);
      }, 4000);
    }
  };

  const handleReset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const newGame = new Chess();
    newGame.load(BULLETPROOF_FEN);
    setGame(newGame);
    setMoveIndex(0);
    setStatusText("White to move — find the checkmate in 4 moves!");
    setStatusClass('');
    setShowHint(false);
    setSolved(false);
    setWaitingForBlack(false);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const totalMoves = EXPLICIT_SOLUTION.length;

  return (
    <div className="chess-puzzle-gate">
      <div className="chess-content">
        
        {/* Core Request Headings Header */}
        <div className="chess-header">
          <div className="chess-lock-icon">🔒</div>
          <h1 className="tracking-wide text-3xl font-bold uppercase mb-2">Solve to Unlock</h1>
          <p className="opacity-90 max-w-sm mx-auto">Find the checkmate in 4 moves to reveal something special</p>
          <p className="name-tease italic mt-2 text-rose-300 font-serif">— for Paula —</p>
        </div>

        {/* Move tracker dots layout */}
        <div className="chess-move-counter">
          {Array.from({ length: totalMoves }).map((_, i) => (
            <div
              key={i}
              className={`move-dot ${
                i < moveIndex ? 'completed' : i === moveIndex && !solved ? 'current' : solved ? 'completed' : ''
              }`}
            />
          ))}
          <span className="text-xs font-semibold uppercase tracking-wider ml-2">
            {solved ? 'Checkmate!' : `Move ${moveIndex + 1}/${totalMoves}`}
          </span>
        </div>

        {/* RICH CHESSBOARD CONTAINER: Features premium dark wood outer outline border frame */}
        <div className="w-full max-w-[420px] p-4 bg-gradient-to-br from-[#3e2723] via-[#1a0c0a] to-[#3e2723] rounded-xl shadow-2xl border-4 border-[#2d1a18]/80 ring-2 ring-amber-900/40 subtle-scale-in">
          <div className="grid grid-cols-8 grid-rows-8 aspect-square w-full rounded-sm overflow-hidden bg-stone-900 shadow-inner">
            {ROWS.map((row, rowIndex) =>
              COLS.map((col, colIndex) => {
                const square = col + row;
                const pieceData = getPieceDetails(square);
                const isDarkSquare = (colIndex + rowIndex) % 2 === 1;
                
                // State highlights tracking
                const isSelected = selectedSquare === square;
                const isValidTarget = legalMoves.includes(square);

                return (
                  <button
                    key={square}
                    onClick={() => onSquareClick(square)}
                    className={`
                      relative w-full h-full flex items-center justify-center select-none transition-all duration-200 aspect-square
                      ${isDarkSquare ? 'bg-[#704224]' : 'bg-[#f5f2eb]'}
                      ${isSelected ? 'ring-4 ring-amber-400 ring-inset z-10 bg-amber-500/40' : ''}
                      ${isValidTarget ? 'after:content-[""] after:absolute after:w-3 after:h-3 after:bg-emerald-500/70 after:rounded-full hover:bg-emerald-500/20' : ''}
                    `}
                  >
                    {pieceData && (
                      <span 
                        className={`
                          text-3xl md:text-4xl font-normal select-none transform transition-transform duration-150 active:scale-110 drop-shadow-md z-20
                          ${pieceData.color === 'w' ? 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]' : 'text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]'}
                        `}
                      >
                        {pieceData.symbol}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---- Status & Controls ---- */}
<div className="chess-status">
  <p className={`status-text ${statusClass}`}>{statusText}</p>
  
  {!solved && !showHint && (
    <button className="chess-hint-btn" onClick={handleHint}>
      💡 Need a hint?
    </button>
  )}
  
  {showHint && !solved && (
    <p className="chess-hint-text">{HINTS[moveIndex]}</p>
  )}
  
  {/* Action Buttons Row */}
  <div className="flex gap-4 mt-2">
    {moveIndex > 0 && !solved && (
      <button className="chess-reset-btn" onClick={handleReset}>
        ↺ Reset Puzzle
      </button>
    )}

    {!solved && (
      <button 
        className="text-xs px-3 py-1 rounded-md border border-dashed border-stone-600 text-stone-400 hover:border-rose-400 hover:text-rose-300 transition-all duration-200 cursor-pointer background-transparent"
        onClick={() => {
          setSolved(true);
          setStatusText("Puzzle bypassed. Unlocking... 💖");
          setStatusClass('success');
          if (onSolved) timeoutRef.current = setTimeout(() => onSolved(), 3000);
        }}
      >
        ⏭ Skip Puzzle
      </button>
    )}
  </div>
</div>
    
      </div>

      <AnimatePresence>
        {solved && (
          <motion.div className="success-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="success-card" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <div className="heart">💖</div>
              <p>{siteContent.chess.successMessage}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}