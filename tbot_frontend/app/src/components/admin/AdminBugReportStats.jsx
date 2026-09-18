function AdminBugReportStats({
  counts,
  statusFilter,
  onStatusChange,
}) {
  const stats = [
    {
      key: "all",
      label: "All Reports",
      count: counts.all,
    },
    {
      key: "open",
      label: "Open",
      count: counts.open,
    },
    {
      key: "in_progress",
      label: "In Progress",
      count: counts.in_progress,
    },
    {
      key: "resolved",
      label: "Resolved",
      count: counts.resolved,
    },
    {
      key: "closed",
      label: "Closed",
      count: counts.closed,
    },
  ];

  return (
    <section className="admin-bugreports-stats">
      {stats.map((stat) => (
        <button
          key={stat.key}
          type="button"
          className={
            statusFilter === stat.key
              ? "admin-bugreports-stat active"
              : "admin-bugreports-stat"
          }
          onClick={() =>
            onStatusChange(stat.key)
          }
        >
          <span className="admin-bugreports-stat-label">
            {stat.label}
          </span>

          <strong>{stat.count}</strong>
        </button>
      ))}
    </section>
  );
}

export default AdminBugReportStats;