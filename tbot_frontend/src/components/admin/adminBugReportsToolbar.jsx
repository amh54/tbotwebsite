function AdminBugReportsToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <section className="admin-bugreports-toolbar">
      <div className="admin-bugreports-search">
        <span>⌕</span>

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search reports, users, categories..."
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(event.target.value)
        }
        className="admin-bugreports-status-filter"
      >
        <option value="all">
          All Statuses
        </option>

        <option value="open">
          Open
        </option>

        <option value="in_progress">
          In Progress
        </option>

        <option value="resolved">
          Resolved
        </option>

        <option value="closed">
          Closed
        </option>
      </select>
    </section>
  );
}

export default AdminBugReportsToolbar;