function timeAgo(ts) {
  if (!ts) return "";
  const diffMs = Date.now() - ts;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "Last week" : `${weeks} weeks ago`;
}

export default function RecentActivity({ items, live }) {
  if (!items || items.length === 0) {
    return <p className="connect-hint">No check-ins yet — your history will show up here.</p>;
  }

  return (
    <ul className="activity-list">
      {items.map((item, i) => (
        <li key={item.signature || item.eventId || i} className="activity-row">
          <span className="activity-check">✓</span>
          <span className="activity-label">{item.label || "Check-in"}</span>
          <span className="activity-time">{timeAgo(item.timestamp)}</span>
          {live && item.signature && (
            <a
              className="activity-link"
              href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
            >
              view
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
