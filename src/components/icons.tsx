export function Atom({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="20" cy="20" rx="18" ry="7" />
        <ellipse cx="20" cy="20" rx="18" ry="7" transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="20" rx="18" ry="7" transform="rotate(120 20 20)" />
      </g>
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}
export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={back ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}
