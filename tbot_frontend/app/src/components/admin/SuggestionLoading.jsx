function SuggestionLoading() {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <div className="loading-spinner" />

        <h2>Loading suggestions</h2>

        <p>
          Preparing the suggestion dashboard and loading submitted suggestions.
        </p>

        <div className="loading-status">
          <span>Loading suggestion data</span>
          <strong>Loading...</strong>
        </div>
      </div>
    </div>
  );
}

export default SuggestionLoading;
