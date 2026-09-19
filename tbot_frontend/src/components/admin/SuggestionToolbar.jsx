function SuggestionToolbar({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
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
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search suggestions, users, categories..."
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
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
        className="admin-bugreports-status-filter"
      >
        <option value="all">All Categories</option>
        <option value="improvement">Improvement</option>
        <option value="feature">New Feature</option>
        <option value="ui">UI / Design</option>
        <option value="performance">Performance</option>
        <option value="other">Other</option>
      </select>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        className="admin-bugreports-status-filter"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="reviewing">Reviewing</option>
        <option value="planned">Planned</option>
        <option value="completed">Completed</option>
        <option value="declined">Declined</option>
      </select>
    </section>
  );
}

export default SuggestionToolbar;
