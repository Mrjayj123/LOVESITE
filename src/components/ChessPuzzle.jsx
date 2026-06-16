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

const TYPE_TO_KEY = {
  king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p'
};

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

  const moveIndexRef = useRef(moveIndex);
  const solvedRef = useRef(solved);
  moveIndexRef.current = moveIndex;
  solvedRef.current = solved;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getPieceDetails = (square) => {
    const piece = game.get(square);
    if (!piece) return null;
    const baseKey = TYPE_TO_KEY[piece.type];
    if (!baseKey) return null;
    const key = piece.color === 'w' ? baseKey.toUpperCase() : baseKey;
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
          setStatusText("Selected piece. Click a highlighted square.");
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

            const currentMoveIndex = moveIndex;
            const nextMoveIndex = currentMoveIndex + 1;
            const isLastMove = currentMoveIndex === EXPLICIT_SOLUTION.length - 1;

            if (isLastMove) {
              setSolved(true);
              setStatusText("Checkmate! Room unlocked. 💖");
              setStatusClass('success');
              if (onSolved) onSolved();
              return;
            }

            setStatusText("Good move! ✨");
            setStatusClass('');
            setMoveIndex(nextMoveIndex);

            const blackMove = EXPLICIT_SOLUTION[currentMoveIndex]?.black;
            if (blackMove) {
              setWaitingForBlack(true);
              const fenAfterWhite = gameCopy.fen();
              timeoutRef.current = setTimeout(() => {
                const afterWhite = new Chess(fenAfterWhite);
                const blackResult = afterWhite.move(blackMove);
                if (blackResult) {
                  setGame(afterWhite);
                  const remaining = EXPLICIT_SOLUTION.length - nextMoveIndex;
                  setStatusText(remaining > 0
                    ? `Move ${nextMoveIndex + 1} of ${EXPLICIT_SOLUTION.length} — Your turn!`
                    : "Almost there...");
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
        setStatusText("Not correct. Try finding a different sequence!");
        setStatusClass('error');
        setSelectedSquare(null);
        setLegalMoves([]);
        timeoutRef.current = setTimeout(() => {
          if (!solvedRef.current) {
            setStatusText(`Move ${moveIndexRef.current + 1} of ${EXPLICIT_SOLUTION.length} — Your turn!`);
            setStatusClass('');
          }
        }, 2000);
      }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === 'w') {
        const moves = getLegalMovesForSquare(square);
        if (moves.length) {
          setSelectedSquare(square);
          setLegalMoves(moves);
          setStatusText("Selected piece. Click a highlighted square.");
          setStatusClass('');
          return;
        }
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      setStatusText("Click one of your pieces to select it.");
      setStatusClass('');
    }
  };

  const handleHint = () => {
    setShowHint(true);
    const expected = EXPLICIT_SOLUTION[moveIndex]?.white;
    if (expected) {
      setStatusText(`Hint: Move ${expected.from.toUpperCase()} → ${expected.to.toUpperCase()}`);
      timeoutRef.current = setTimeout(() => {
        if (!solvedRef.current) {
          setStatusText(`Move ${moveIndexRef.current + 1} of ${EXPLICIT_SOLUTION.length} — Your turn!`);
        }
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

        {/* Header */}
        <div className="chess-header">
          <div className="chess-lock-icon">🔒</div>
          <h1 className="tracking-wide text-3xl font-bold uppercase mb-2">Solve to Unlock</h1>
          <p className="opacity-90 max-w-sm mx-auto">Find the checkmate in 4 moves to reveal something special</p>
          <p className="name-tease italic mt-2 text-rose-300 font-serif">— for Konzi —</p>
        </div>

        {/* Move progress dots */}
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

        {/* Rich Chessboard */}
        <div className="chess-board-wrapper">
          <div className="chess-board-inner">

            {/* Column labels top */}
            <div className="chess-coords-top">
              {COLS.map(col => (
                <span key={col} className="chess-coord-label">{col}</span>
              ))}
            </div>

            <div className="chess-board-rows">
              {ROWS.map((row, rowIndex) => (
                <div key={row} className="chess-board-row">

                  {/* Row label left */}
                  <span className="chess-coord-label chess-coord-side">{row}</span>

                  {COLS.map((col, colIndex) => {
                    const square = col + row;
                    const pieceData = getPieceDetails(square);
                    const isDarkSquare = (colIndex + rowIndex) % 2 === 1;
                    const isSelected = selectedSquare === square;
                    const isValidTarget = legalMoves.includes(square);

                    return (
                      <button
                        key={square}
                        onClick={() => onSquareClick(square)}
                        className={[
                          'chess-square',
                          isDarkSquare ? 'chess-square-dark' : 'chess-square-light',
                          isSelected ? 'chess-square-selected' : '',
                          isValidTarget ? 'chess-square-target' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {/* Valid move dot on empty square */}
                        {isValidTarget && !pieceData && (
                          <span className="chess-move-dot" />
                        )}

                        {/* Capture ring on occupied square */}
                        {isValidTarget && pieceData && (
                          <span className="chess-capture-ring" />
                        )}

                        {/* Piece */}
                        {pieceData && (
                          <span className={`chess-piece ${pieceData.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}`}>
                            {pieceData.symbol}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Row label right */}
                  <span className="chess-coord-label chess-coord-side">{row}</span>

                </div>
              ))}
            </div>

            {/* Column labels bottom */}
            <div className="chess-coords-top">
              {COLS.map(col => (
                <span key={col} className="chess-coord-label">{col}</span>
              ))}
            </div>

          </div>
        </div>

        {/* Status & Controls */}
        <div className="chess-status">
          <p className={`chess-status-text ${statusClass}`}>{statusText}</p>

          {!solved && !showHint && (
            <button className="chess-hint-btn" onClick={handleHint}>
              💡 Need a hint?
            </button>
          )}

          {showHint && !solved && (
            <p className="chess-hint-text">{HINTS[moveIndex]}</p>
          )}

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
                  if (onSolved) onSolved();
                }}
              >
                ⏭ Skip Puzzle
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            className="chess-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="chess-success-content"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <div className="chess-success-heart">💖</div>
              <p className="chess-success-text">{siteContent.chess.successMessage}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}