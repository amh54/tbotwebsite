function SuggestionEmptyState({
  search,
  statusFilter,
  categoryFilter,
  clearFilters,
}) {
  const hasFilters =
    search || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <section className="admin-bugreports-empty">
      <div className="admin-bugreports-empty-icon">✓</div>

      <h2>No suggestions found</h2>

      <p>There are no suggestions matching your current search and filters.</p>

      {hasFilters && (
        <button type="button" onClick={clearFilters}>
          Clear Filters
        </button>
      )}
    </section>
  );
}

export default SuggestionEmptyState;
