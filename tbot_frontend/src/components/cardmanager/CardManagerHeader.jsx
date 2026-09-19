import { Link } from "react-router-dom";

const CardManagerHeader = ({ onAddCards }) => {
  return (
    <div className="card-manager-header">
      <div>
        <h1>Card Manager</h1>
        <p>Manage the cards in your collection.</p>
      </div>

      <div className="user-card-manager-actions">
        <Link to="/dashboard" className="user-card-manager-back-admin">
          ← Back to Dashboard
        </Link>

        <button type="button" className="add-cards-button" onClick={onAddCards}>
          Add Cards
        </button>
      </div>
    </div>
  );
};

export default CardManagerHeader;
