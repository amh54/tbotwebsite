const CardManagerSummary = ({ ownedCount, totalQuantity }) => {
  return (
    <section className="card-manager-summary">
      <div className="summary-item">
        <span className="summary-label">Unique Cards</span>
        <strong>{ownedCount}</strong>
      </div>

      <div className="summary-item">
        <span className="summary-label">Total Copies</span>
        <strong>{totalQuantity}</strong>
      </div>
    </section>
  );
};

export default CardManagerSummary;
