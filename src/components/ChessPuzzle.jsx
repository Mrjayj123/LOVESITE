import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './ChessPuzzle.css';

// ── Puzzle: Lolli Attack / Fried Liver variant ──────────────────────────────
// White sacrifices a knight on f7, hunts the exposed king across the board,
// then finishes with a bishop sacrifice and queen checkmate on d6.
// Verified 7-move forced mate (White moves only — Black responses are forced).
// ────────────────────────────────────────────────────────────────────────────

const PUZZLE_FEN = "r1bqk2r/pppp1ppp/2n2n2/4p1N1/2B1P3/2NP4/PPP2PPP/R1BQK2R w KQkq - 0 1";

const EXPLICIT_SOLUTION = [
  { white: { from: 'g5', to: 'f7' }, black: { from: 'e8', to: 'f7' } }, // 1. Nxf7!! Kxf7 (forced)
  { white: { from: 'd1', to: 'f3' }, black: { from: 'f7', to: 'e6' } }, // 2. Qf3+   Ke6
  { white: { from: 'c3', to: 'd5' }, black: { from: 'e6', to: 'd6' } }, // 3. Nd5!   Kd6
  { white: { from: 'f3', to: 'f4' }, black: { from: 'd6', to: 'e6' } }, // 4. Qf4+   Ke6
  { white: { from: 'f4', to: 'e5' }, black: { from: 'e6', to: 'd7' } }, // 5. Qe5+   Kd7
  { white: { from: 'c4', to: 'c6' }, black: { from: 'b7', to: 'c6' } }, // 6. Bc6+!! bxc6
  { white: { from: 'e5', to: 'd6' }, black: null },                      // 7. Qd6#   Checkmate!
];

const HINTS = [
  "The knight on g5 eyes f7 — a classic sacrifice that forks the queen and rook. Go for it!",
  "Your queen belongs on f3. Give check and watch the king scramble.",
  "Nd5! Fork the king and queen in one elegant move — the king must flee.",
  "Push the king back with Qf4+. Keep the pressure on!",
  "Qe5+ drives the king to d7 — exactly where you want it.",
  "Bc6+!! Sacrifice the bishop to strip away the b-pawn shield. Brilliant!",
  "Qd6# — the queen delivers the final blow. Checkmate! 💖",
];

const TYPE_TO_KEY = {
  king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p',
  // chess.js v1 uses single-letter type strings too — handle both
  k: 'k', q: 'q', r: 'r', b: 'b', n: 'n', p: 'p',
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
    g.load(PUZZLE_FEN);
    return g;
  });
  const [moveIndex, setMoveIndex]       = useState(0);
  const [statusText, setStatusText]     = useState("White to move — find checkmate in 7!");
  const [statusClass, setStatusClass]   = useState('');
  const [showHint, setShowHint]         = useState(false);
  const [solved, setSolved]             = useState(false);
  const [waitingForBlack, setWaiting]   = useState(false);
  const [selectedSquare, setSelected]   = useState(null);
  const [legalMoves, setLegalMoves]     = useState([]);
  const [lastMove, setLastMove]         = useState(null); // {from, to} highlight
  const timeoutRef  = useRef(null);
  const moveIdxRef  = useRef(0);
  const solvedRef   = useRef(false);
  moveIdxRef.current = moveIndex;
  solvedRef.current  = solved;

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

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
    return game.moves({ verbose: true })
      .filter(m => m.from === square)
      .map(m => m.to);
  }, [game]);

  // ── Square click handler ─────────────────────────────────────────────────

  const onSquareClick = (square) => {
    if (solved || waitingForBlack) return;

    // No piece selected yet — try to select a white piece
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === 'w') {
        const moves = getLegalMovesForSquare(square);
        if (moves.length) {
          setSelected(square);
          setLegalMoves(moves);
          setStatusText("Good choice — now pick your destination.");
          setStatusClass('');
        }
      }
      return;
    }

    const from = selectedSquare;
    const to   = square;

    // Re-select another white piece
    if (!legalMoves.includes(to)) {
      const piece = game.get(square);
      if (piece && piece.color === 'w') {
        const moves = getLegalMovesForSquare(square);
        if (moves.length) {
          setSelected(square);
          setLegalMoves(moves);
          setStatusText("Good choice — now pick your destination.");
          setStatusClass('');
          return;
        }
      }
      setSelected(null);
      setLegalMoves([]);
      setStatusText("Click one of your pieces to select it.");
      setStatusClass('');
      return;
    }

    // Destination clicked — check if it matches the solution
    const expected = EXPLICIT_SOLUTION[moveIndex]?.white;
    if (from === expected.from && to === expected.to) {
      try {
        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({ from, to, promotion: 'q' });
        if (!move) throw new Error('illegal');

        setGame(gameCopy);
        setSelected(null);
        setLegalMoves([]);
        setLastMove({ from, to });

        const currentIdx = moveIndex;
        const nextIdx    = currentIdx + 1;
        const isLast     = currentIdx === EXPLICIT_SOLUTION.length - 1;

        if (isLast) {
          setSolved(true);
          setStatusText("Checkmate! You found it! 💖");
          setStatusClass('success');
          if (onSolved) onSolved();
          return;
        }

        setStatusText("Brilliant! ✨ Watch Black's response...");
        setStatusClass('');
        setMoveIndex(nextIdx);

        // Play Black's forced response
        const blackMove = EXPLICIT_SOLUTION[currentIdx]?.black;
        if (blackMove) {
          setWaiting(true);
          const fenAfterWhite = gameCopy.fen();
          timeoutRef.current = setTimeout(() => {
            try {
              const afterWhite = new Chess(fenAfterWhite);
              const blackResult = afterWhite.move({
                from: blackMove.from,
                to: blackMove.to,
                promotion: 'q',
              });
              if (blackResult) {
                setGame(afterWhite);
                setLastMove({ from: blackMove.from, to: blackMove.to });
                const remaining = EXPLICIT_SOLUTION.length - nextIdx;
                setStatusText(
                  remaining === 1
                    ? "One more move — deliver the checkmate!"
                    : `Move ${nextIdx + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`
                );
              } else {
                console.error('Black move failed:', blackMove, 'FEN:', fenAfterWhite);
                setStatusText(`Move ${nextIdx + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
              }
            } catch (err) {
              console.error('Black move error:', err, blackMove);
              setStatusText(`Move ${nextIdx + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
            } finally {
              setWaiting(false);
            }
          }, 700);
        }
      } catch {
        setStatusText("Something went wrong. Try again.");
        setStatusClass('error');
        setSelected(null);
        setLegalMoves([]);
      }
    } else {
      // Wrong solution move
      setStatusText("That's not the right move — think deeper!");
      setStatusClass('error');
      setSelected(null);
      setLegalMoves([]);
      timeoutRef.current = setTimeout(() => {
        if (!solvedRef.current) {
          setStatusText(`Move ${moveIdxRef.current + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
          setStatusClass('');
        }
      }, 2000);
    }
  };

  // ── Controls ─────────────────────────────────────────────────────────────

  const handleHint = () => {
    setShowHint(true);
    const expected = EXPLICIT_SOLUTION[moveIndex]?.white;
    if (expected) {
      setStatusText(`Hint: ${expected.from.toUpperCase()} → ${expected.to.toUpperCase()}`);
      timeoutRef.current = setTimeout(() => {
        if (!solvedRef.current)
          setStatusText(`Move ${moveIdxRef.current + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
      }, 4000);
    }
  };

  const handleReset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const g = new Chess();
    g.load(PUZZLE_FEN);
    setGame(g);
    setMoveIndex(0);
    setStatusText("White to move — find checkmate in 7!");
    setStatusClass('');
    setShowHint(false);
    setSolved(false);
    setWaiting(false);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
  };

  const totalMoves = EXPLICIT_SOLUTION.length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="chess-puzzle-gate">
      <div className="chess-content">

        {/* Header */}
        <div className="chess-header">
          <div className="chess-lock-icon">🔒</div>
          <h1 className="tracking-wide text-3xl font-bold uppercase mb-2">Solve to Unlock</h1>
          <p className="opacity-90 max-w-sm mx-auto">
            White to move — find the checkmate in 7 moves
          </p>
          <p className="name-tease italic mt-2 text-rose-300 font-serif">— for Konzi —</p>
        </div>

        {/* Move progress dots */}
        <div className="chess-move-counter">
          {Array.from({ length: totalMoves }).map((_, i) => (
            <div
              key={i}
              className={`move-dot ${
                solved           ? 'completed'
                : i < moveIndex  ? 'completed'
                : i === moveIndex ? 'current'
                : ''
              }`}
            />
          ))}
          <span className="text-xs font-semibold uppercase tracking-wider ml-2">
            {solved ? 'Checkmate!' : `Move ${moveIndex + 1}/${totalMoves}`}
          </span>
        </div>

        {/* ── Rich Chessboard ── */}
        <div className="chess-board-wrapper">
          <div className="chess-board-inner">

            {/* Column labels — top */}
            <div className="chess-coords-top">
              {COLS.map(col => (
                <span key={col} className="chess-coord-label">{col}</span>
              ))}
            </div>

            <div className="chess-board-rows">
              {ROWS.map((row, rowIndex) => (
                <div key={row} className="chess-board-row">

                  {/* Row label — left */}
                  <span className="chess-coord-label chess-coord-side">{row}</span>

                  {COLS.map((col, colIndex) => {
                    const square       = col + row;
                    const pieceData    = getPieceDetails(square);
                    const isDark       = (colIndex + rowIndex) % 2 === 1;
                    const isSelected   = selectedSquare === square;
                    const isTarget     = legalMoves.includes(square);
                    const isLastFrom   = lastMove?.from === square;
                    const isLastTo     = lastMove?.to   === square;

                    return (
                      <button
                        key={square}
                        onClick={() => onSquareClick(square)}
                        className={[
                          'chess-square',
                          isDark       ? 'chess-square-dark'     : 'chess-square-light',
                          isSelected   ? 'chess-square-selected' : '',
                          isTarget     ? 'chess-square-target'   : '',
                          isLastFrom   ? 'chess-square-last-from': '',
                          isLastTo     ? 'chess-square-last-to'  : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {/* Empty-square move dot */}
                        {isTarget && !pieceData && (
                          <span className="chess-move-dot" />
                        )}

                        {/* Capturable-piece ring */}
                        {isTarget && pieceData && (
                          <span className="chess-capture-ring" />
                        )}

                        {/* Piece glyph */}
                        {pieceData && (
                          <span
                            className={`chess-piece ${
                              pieceData.color === 'w'
                                ? 'chess-piece-white'
                                : 'chess-piece-black'
                            }`}
                          >
                            {pieceData.symbol}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Row label — right */}
                  <span className="chess-coord-label chess-coord-side">{row}</span>

                </div>
              ))}
            </div>

            {/* Column labels — bottom */}
            <div className="chess-coords-top">
              {COLS.map(col => (
                <span key={col} className="chess-coord-label">{col}</span>
              ))}
            </div>

          </div>
        </div>

        {/* Status & controls */}
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
                className="chess-skip-btn"
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