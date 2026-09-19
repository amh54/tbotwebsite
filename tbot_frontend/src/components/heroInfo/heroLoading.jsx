function HeroLoading({ totalHeroes }) {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <div className="loading-spinner" />

        <h2>
          <span> Loading heroes </span>

          <span className="loading-dots">
            <span />
            <span />
            <span />
          </span>
        </h2>

        <p>
          Preparing the hero browser and loading
          available heroes.
        </p>

        <div className="loading-status">
          <span>Loading hero data</span>

          <strong>
            {totalHeroes > 0
              ? `${totalHeroes} heroes`
              : "Loading..."}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default HeroLoading;