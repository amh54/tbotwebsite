function SuggestionStats({
  counts,
  statusFilter,
  setStatusFilter,
}) {
  const statuses = [
    ["all", "All Suggestions"],
    ["pending", "Pending"],
    ["reviewing", "Reviewing"],
    ["planned", "Planned"],
    ["completed", "Completed"],
    ["declined", "Declined"],
  ];

  return (
    <section className="admin-bugreports-stats">
      {statuses.map(([status, label]) => (
        <button
          key={status}
          type="button"
          className={
            statusFilter === status
              ? "admin-bugreports-stat active"
              : "admin-bugreports-stat"
          }
          onClick={() => setStatusFilter(status)}
        >
          <span className="admin-bugreports-stat-label">
            {label}
          </span>

          <strong>{counts[status]}</strong>
        </button>
      ))}
    </section>
  );
}

export default SuggestionStats;