import { useEffect, useState } from "react";

const COLORS = ["#f2b705", "#2c7a4f", "#c1272d", "#f2efe6"];
const PIECE_COUNT = 26;

// triggerKey should change (e.g. Date.now()) every time you want a new burst.
export default function ConfettiBurst({ triggerKey }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!triggerKey) return;
    const next = Array.from({ length: PIECE_COUNT }, (_, i) => ({
      id: `${triggerKey}-${i}`,
      left: 42 + Math.random() * 16,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.12,
      dx: (Math.random() - 0.5) * 240,
      rot: Math.round(Math.random() * 360),
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 1300);
    return () => clearTimeout(t);
  }, [triggerKey]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            "--dx": `${p.dx}px`,
            "--rot": `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
