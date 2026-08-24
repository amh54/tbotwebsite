import { useEffect, useState } from "react";

import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import ProfileCardBrowser from "../components/profilecardbrowser.jsx";

import "../css/cardinfo.css";
import "../css/navbar.css";
import "../css/loading.css";

const API_BASE_URL = "http://localhost:8000";

export default function ProfileCards() {
  const [userCards, setUserCards] = useState([]);

  useEffect(() => {
    async function loadCards() {
      const response = await fetch(
        `${API_BASE_URL}/tbotapp/user-cards/?profile=tbonegaming344`,
      );

      const data = await response.json();

      console.log("API CARD DATA:", data);

      setUserCards(data.cards || []);
    }

    loadCards();
  }, []);

  return (
    <>
      <Navbar />

      <main className="card-information-page">
        <ProfileCardBrowser cards={userCards} />
      </main>

      <Footer />
    </>
  );
}
