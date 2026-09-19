import SuggestionCard from "./SuggestionCard";

function SuggestionList({
  suggestions,
  updatingId,
  deletingId,
  onStatusChange,
  onDelete,
  onViewDetails,
}) {
  return (
    <section className="admin-bugreports-list">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={
            suggestion?.id ??
            suggestion?.suggestion_id ??
            `${suggestion?.title || "suggestion"}-${suggestion?.created_at || ""}`
          }
          suggestion={suggestion}
          updatingId={updatingId}
          deletingId={deletingId}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </section>
  );
}

export default SuggestionList;
