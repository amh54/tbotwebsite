function CardBrowserLoading({ totalCards }) {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <div className="loading-spinner" />

        <h2>
          <span>Loading cards </span>
          <span className="loading-dots">
            <span />
            <span />
            <span />
          </span>
        </h2>

        <p>Preparing the card browser and loading available cards.</p>

        <div className="loading-status">
          <span>Loading card data</span>

          <strong>
            {totalCards > 0 ? `${totalCards} cards` : "Loading..."}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default CardBrowserLoading;