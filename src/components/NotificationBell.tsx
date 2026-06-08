export function NotificationBell({
  needsAttention,
  onClick,
}: {
  needsAttention: boolean;
  onClick: () => void;
}) {
  return (
    <button className="bell" onClick={onClick} aria-label="Notifications and setup">
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {needsAttention && <span className="bell-dot" aria-hidden="true" />}
    </button>
  );
}
