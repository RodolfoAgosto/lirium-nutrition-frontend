// Soft decorative leaves (the logo shape) behind public pages.
// Purely visual: hidden from assistive tech and ignores pointer events.
const LEAF = "M9 35 L9 5 Q9 2 12 2 Q24 2 31 14 Q36 22 28 30 Q22 36 9 35 Z";

const LEAVES = [
  { className: "-left-24 -top-16 h-[420px] w-[420px] -rotate-[25deg] opacity-[0.07]" },
  { className: "-bottom-32 -right-20 h-[560px] w-[560px] rotate-[155deg] opacity-[0.07]" },
  { className: "right-[12%] top-[8%] hidden h-[160px] w-[160px] rotate-[35deg] opacity-[0.05] md:block" },
  { className: "bottom-[6%] left-[8%] hidden h-[200px] w-[200px] -rotate-[70deg] opacity-[0.05] md:block" },
];

export function LeafBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {LEAVES.map((leaf, i) => (
        <svg key={i} viewBox="8 1 28 36" className={`absolute ${leaf.className}`}>
          <path d={LEAF} fill="#2E7D32" />
        </svg>
      ))}
    </div>
  );
}
