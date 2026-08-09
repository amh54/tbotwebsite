import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CardModal from "../components/cardmodal";

import "../css/cardinformation.css";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
    /\/+$/,
    "",
  );

const STAT_ICON_LINKS = {
  cost: "https://i.ibb.co/Q30j2CgC/brainz.webp",
  strength: "https://i.ibb.co/GQt785K6/strength.webp",
  health: "https://i.ibb.co/bMj86Wvg/health.webp",
};

function CardInformation() {
  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";

  const [cards, setCards] = useState([]);

  const [selectedCard, setSelectedCard] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/tbotapp/cardinformation/`)
      .then((response) => response.json())

      .then((data) => {
        setCards(data);

        setLoading(false);
      })

      .catch((error) => {
        console.error(error);

        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card-page">
        <h1>Loading Cards...</h1>
      </div>
    );
  }

  return (
    <div className="card-page">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">Tbot</Link>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>

          <Link to="/decklists">Decklists</Link>

          <Link to="/cardinformation">Card Information</Link>
        </div>
      </nav>

      <h1>Card Information</h1>

      <div className="card-grid">
        {cards.map((card) => (
          <div className="card-item" key={card.cardid}>
            <div className="card-item-media">
              <img src={card.thumbnail} alt={card.card_name} />
            </div>

            <div className="card-item-info">
              <h2>{card.card_name || "Unknown Card"}</h2>

              {hasValue(card.card_type) && (
                <p>
                  <span>Type:</span> {card.card_type}
                </p>
              )}

              {(hasValue(card.cost) ||
                hasValue(card.strength) ||
                hasValue(card.health)) && (
                <p className="card-stats-line">
                  <span className="card-field-label">Stats:</span>

                  {hasValue(card.cost) && (
                    <span className="card-stat-row stat-cost">
                      {card.cost}
                      <img
                        src={STAT_ICON_LINKS.cost}
                        alt="Cost"
                        className="card-stat-icon"
                      />
                    </span>
                  )}

                  {hasValue(card.strength) && (
                    <span className="card-stat-row stat-strength">
                      {card.strength}
                      <img
                        src={STAT_ICON_LINKS.strength}
                        alt="Strength"
                        className="card-stat-icon"
                      />
                    </span>
                  )}

                  {hasValue(card.health) && (
                    <span className="card-stat-row stat-health">
                      {card.health}
                      <img
                        src={STAT_ICON_LINKS.health}
                        alt="Health"
                        className="card-stat-icon"
                      />
                    </span>
                  )}
                </p>
              )}

              {hasValue(card.set_rarity) && (
                <p>
                  <span>Rarity:</span> {card.set_rarity}
                </p>
              )}

              <button type="button" onClick={() => setSelectedCard(card)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <CardModal card={selectedCard} close={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default CardInformation;
