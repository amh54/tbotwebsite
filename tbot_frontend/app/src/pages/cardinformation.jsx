import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CardModal from "../components/cardmodal";

import "../css/cardinformation.css";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
    /\/+$/,
    "",
  );

function CardInformation() {
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
            <img src={card.thumbnail} alt={card.card_name} />

            <button onClick={() => setSelectedCard(card)}>View Details</button>
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
