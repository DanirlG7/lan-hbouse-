import React from 'react';

interface Props {
  percent: number;
  cells?: number;
  color?: 'cyan' | 'green' | 'gold';
}

export const SegmentedBar: React.FC<Props> = ({
  percent,
  cells = 18,
  color = 'cyan',
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const filledCount = Math.round((clamped / 100) * cells);
  const fillClass =
    color === 'green'
      ? 'filled-green'
      : color === 'gold'
      ? 'filled-gold'
      : 'filled-cyan';

  return (
    <div className="segmented-bar" title={`${Math.round(clamped)}%`}>
      {Array.from({ length: cells }).map((_, idx) => (
        <span
          key={idx}
          className={`segmented-cell ${idx < filledCount ? fillClass : ''}`}
        />
      ))}
    </div>
  );
};
