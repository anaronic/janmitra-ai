export default function AshokaChakra({ size = 44, color = "#13357b" }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Ashoka Chakra"
      className="ashoka-chakra"
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="4" />
      <circle cx="50" cy="50" r="6" fill={color} />
      {spokes.map((angle) => (
        <line
          key={angle}
          x1="50"
          y1="50"
          x2="50"
          y2="6"
          stroke={color}
          strokeWidth="2"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
    </svg>
  );
}
