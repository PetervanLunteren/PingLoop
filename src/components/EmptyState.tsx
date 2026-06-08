export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {hint}
    </div>
  );
}
