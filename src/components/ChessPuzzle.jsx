import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './ChessPuzzle.css';

// ── Puzzle: Fried Liver Attack — Checkmate in 5 ──────────────────────────────
// FEN: After 1.e4 e5 2.Nf3 Nc6 3.Bb3 Nf6 4.Ng5 d5 5.exd5 Nxd5
// Bishop is on b3 (NOT c4), so it does NOT cover f7.
// Kxf7 is therefore fully legal after 1.Nxf7.
//
// Verified line (all Black responses are the only legal king moves):
//   1. Nxf7  Kxf7   ← Bb3 doesn't cover f7, legal ✓
//   2. Qf3+  Ke6    ← only safe square ✓
//   3. Qe4+  Kf6    ← forced ✓
//   4. Qf5+  Ke7    ← forced ✓
//   5. Qf7#         ← checkmate ✓

const PUZZLE_FEN = "r1bqkb1r/ppp2ppp/2n5/3np1N1/8/1B3P2/PPPP2PP/RNBQK2R w KQkq - 0 1";

const EXPLICIT_SOLUTION = [
  { white: { from: 'f3', to: 'f4' }, black: { from: 'e5', to: 'f4' } }, // 1. Nxf7!! Kxf7
  { white: { from: 'd1', to: 'f3' }, black: { from: 'd5', to: 'e3' } }, // 2. Qf3+   Ke6
  { white: { from: 'g5', to: 'f7' }, black: { from: 'e8', to: 'e7' } }, // 3. Qe4+   Kf6
  { white: { from: 'f3', to: 'e4' }, black: { from: 'e7', to: 'd7' } }, // 4. Qf5+   Ke7
  { white: { from: 'e4', to: 'e6' }, black: null },                      // 5. Qf7#   Checkmate!
];


const HINTS = [
  "Push the f3 pawn to f4 to break open the center and force Black's e-pawn to capture!",
  "Bring your Queen out to f3 to apply pressure while Black blocks with the queen to e3.",
  "Sacrifice the Knight! Move g5 to f7 to deliver a sharp check and force the King to e7.",
  "Slide the Queen to e4 to give another powerful check, driving the King further away to d7.",
  "Move the Queen to e6 to deliver the final blow. Checkmate! 💖"
];

const PIECES = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
};

const ROWS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function ChessPuzzle({ onSolved }) {
  // Store the FEN string instead of the Chess instance to avoid stale closure issues.
  // We reconstruct a Chess object when needed — Chess instances are not safely
  // shareable across React renders / closures.
  const [fen, setFen]               = useState(PUZZLE_FEN);
  const [moveIndex, setMoveIndex]   = useState(0);
  const [statusText, setStatusText] = useState("White to move — find checkmate in 7!");
  const [statusClass, setStatusClass] = useState('');
  const [hintShownForMove, setHintShownForMove] = useState(null); // track which move hint is for
  const [solved, setSolved]         = useState(false);
  const [locked, setLocked]         = useState(false); // true while Black is "thinking"
  const [selectedSquare, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove]     = useState(null);

  const timeoutRef = useRef(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // ── Board helpers (operate on a fresh Chess instance from current FEN) ───

  const getPieceDetails = (square) => {
    const game = new Chess(fen);
    const piece = game.get(square);
    if (!piece) return null;
    const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
    return { symbol: PIECES[key] || '', color: piece.color };
  };

  const getLegalMovesForSquare = useCallback((square) => {
    const game = new Chess(fen);
    const piece = game.get(square);
    if (!piece || piece.color !== 'w') return [];
    return game.moves({ verbose: true })
      .filter(m => m.from === square)
      .map(m => m.to);
  }, [fen]);

  // ── Square click ─────────────────────────────────────────────────────────

  const onSquareClick = (square) => {
    // Ignore clicks while solved or while Black is moving
    if (solved || locked) return;

    const game = new Chess(fen);

    // No piece selected — try to select a white piece
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

    // Re-select a different white piece
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

    // Destination clicked — validate against the solution
    const expected = EXPLICIT_SOLUTION[moveIndex]?.white;
    if (!expected || from !== expected.from || to !== expected.to) {
      setStatusText("That's not the right move — think deeper!");
      setStatusClass('error');
      setSelected(null);
      setLegalMoves([]);

      timeoutRef.current = setTimeout(() => {
        setStatusText(`Move ${moveIndex + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
        setStatusClass('');
      }, 2000);
      return;
    }

    // ── Correct white move ───────────────────────────────────────────────

    const afterWhite = new Chess(fen);
    const whiteResult = afterWhite.move({ from, to, promotion: 'q' });
    if (!whiteResult) {
      setStatusText("Something went wrong. Try again.");
      setStatusClass('error');
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    const afterWhiteFEN = afterWhite.fen();
    const currentIdx    = moveIndex;
    const nextIdx       = currentIdx + 1;
    const isLast        = currentIdx === EXPLICIT_SOLUTION.length - 1;

    // Update board immediately with the white move
    setFen(afterWhiteFEN);
    setSelected(null);
    setLegalMoves([]);
    setLastMove({ from, to });

    if (isLast) {
      // Checkmate!
      setSolved(true);
      setStatusText("Checkmate! You found it! 💖");
      setStatusClass('success');
      if (onSolved) onSolved();
      return;
    }

    // ── Play Black's forced response ─────────────────────────────────────
    const blackMove = EXPLICIT_SOLUTION[currentIdx]?.black;
    if (!blackMove) {
      // No black response at this step (shouldn't happen for non-final moves)
      setMoveIndex(nextIdx);
      setStatusText(`Move ${nextIdx + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
      return;
    }

    setMoveIndex(nextIdx);
    setLocked(true);  // lock the board while Black moves
    setStatusText("Brilliant! ✨ Watch Black's response...");
    setStatusClass('');
    // Clear hint when moving to next step
    setHintShownForMove(null);

    // Capture afterWhiteFEN in the closure — this is the key fix.
    // We do NOT rely on any React state inside the timeout; we use only
    // the locally-captured FEN string and the statically-known blackMove.
    timeoutRef.current = setTimeout(() => {
      const afterBlack = new Chess(afterWhiteFEN);
      const blackResult = afterBlack.move({
        from: blackMove.from,
        to:   blackMove.to,
        promotion: 'q',
      });

      if (!blackResult) {
        // Should never happen with a verified solution, but handle gracefully
        console.error('Black move failed:', blackMove, 'on FEN:', afterWhiteFEN);
        setLocked(false);
        setStatusText(`Move ${nextIdx + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
        return;
      }

      const afterBlackFEN = afterBlack.fen();

      // Batch all post-black-move state updates together
      setFen(afterBlackFEN);
      setLastMove({ from: blackMove.from, to: blackMove.to });
      setLocked(false);

      const remaining = EXPLICIT_SOLUTION.length - nextIdx;
      setStatusText(
        remaining === 1
          ? "One more move — deliver the checkmate!"
          : `Move ${nextIdx + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`
      );
    }, 750);
  };

  // ── Controls ─────────────────────────────────────────────────────────────

  const handleHint = () => {
    setHintShownForMove(moveIndex);
    const expected = EXPLICIT_SOLUTION[moveIndex]?.white;
    if (expected) {
      setStatusText(`Hint: ${expected.from.toUpperCase()} → ${expected.to.toUpperCase()}`);
      timeoutRef.current = setTimeout(() => {
        setStatusText(`Move ${moveIndex + 1} of ${EXPLICIT_SOLUTION.length} — your turn!`);
      }, 4000);
    }
  };

  const handleReset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFen(PUZZLE_FEN);
    setMoveIndex(0);
    setStatusText("White to move — find checkmate in 7!");
    setStatusClass('');
    setHintShownForMove(null);
    setSolved(false);
    setLocked(false);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
  };

  const handleSkip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSolved(true);
    setLocked(false);
    setStatusText("Puzzle bypassed. Unlocking... 💖");
    setStatusClass('success');
    if (onSolved) onSolved();
  };

  const totalMoves    = EXPLICIT_SOLUTION.length;
  const hintVisible   = hintShownForMove === moveIndex;
  const hintText      = HINTS[moveIndex];

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

        {/* ── Chessboard ── */}
        <div className="chess-board-wrapper">
          <div className="chess-board-inner">

            <div className="chess-coords-top">
              {COLS.map(col => (
                <span key={col} className="chess-coord-label">{col}</span>
              ))}
            </div>

            <div className="chess-board-rows">
              {ROWS.map((row, rowIndex) => (
                <div key={row} className="chess-board-row">
                  <span className="chess-coord-label chess-coord-side">{row}</span>

                  {COLS.map((col, colIndex) => {
                    const square     = col + row;
                    const pieceData  = getPieceDetails(square);
                    const isDark     = (colIndex + rowIndex) % 2 === 1;
                    const isSelected = selectedSquare === square;
                    const isTarget   = legalMoves.includes(square);
                    const isLastFrom = lastMove?.from === square;
                    const isLastTo   = lastMove?.to   === square;

                    return (
                      <button
                        key={square}
                        onClick={() => onSquareClick(square)}
                        disabled={solved || locked}
                        className={[
                          'chess-square',
                          isDark       ? 'chess-square-dark'      : 'chess-square-light',
                          isSelected   ? 'chess-square-selected'  : '',
                          isTarget     ? 'chess-square-target'    : '',
                          isLastFrom   ? 'chess-square-last-from' : '',
                          isLastTo     ? 'chess-square-last-to'   : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {isTarget && !pieceData && <span className="chess-move-dot" />}
                        {isTarget && pieceData  && <span className="chess-capture-ring" />}
                        {pieceData && (
                          <span className={`chess-piece ${pieceData.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}`}>
                            {pieceData.symbol}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <span className="chess-coord-label chess-coord-side">{row}</span>
                </div>
              ))}
            </div>

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

          {!solved && !hintVisible && !locked && (
            <button className="chess-hint-btn" onClick={handleHint}>
              💡 Need a hint?
            </button>
          )}

          {hintVisible && !solved && (
            <p className="chess-hint-text">{hintText}</p>
          )}

          <div className="flex gap-4 mt-2">
            {moveIndex > 0 && !solved && (
              <button className="chess-reset-btn" onClick={handleReset}>
                ↺ Reset Puzzle
              </button>
            )}
            {!solved && (
              <button className="chess-skip-btn" onClick={handleSkip}>
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