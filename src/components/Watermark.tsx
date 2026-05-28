export function Watermark({ identifier }: { identifier: string }) {
  if (!identifier) return null;

  // 한 행에 ID 반복해서 사선 전체를 채움
  const repeatedText = Array.from({ length: 50 }, () => identifier).join(
    "   ",
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
    >
      <div
        className="absolute inset-0 flex flex-col justify-around"
        style={{
          transform: "rotate(-30deg) scale(1.5)",
          transformOrigin: "center",
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="whitespace-nowrap font-mono text-base text-gray-400"
            style={{ opacity: 0.08 }}
          >
            {repeatedText}
          </div>
        ))}
      </div>
    </div>
  );
}
