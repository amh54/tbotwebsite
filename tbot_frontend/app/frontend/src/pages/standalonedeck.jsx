import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import DeckCard from "../components/deckcomponent";

import Navbar from "../components/navbar";

import Footer from "../components/footer";

import "../css/decklists.css";

import "../css/navbar.css";

import "../css/loading.css";

import "../css/userdecklists.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const normalizeText = (value) => String(value ?? "").trim();

function StandaloneDeckPage() {
  const { profile_slug, deckId } = useParams();

  const [profile, setProfile] = useState(null);
  const [deck, setDeck] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Deck";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  /*
   * Load ONLY the requested shared deck.
   *
   * This route is used for decks belonging to private profiles.
   * Public-profile decks are accessed through:
   *
   * /profile/:profile_slug
   */
  useEffect(() => {
    const controller = new AbortController();

    const loadDeck = async () => {
      try {
        setLoading(true);
        setError("");
        setDeck(null);
        setProfile(null);

        if (!profile_slug || !deckId) {
          throw new Error("Invalid deck link.");
        }

        const sharedDeckKey = String(deckId).trim();
        const deckIdMatch = sharedDeckKey.match(/-(\d+)$/);

        if (!deckIdMatch) {
          throw new Error("Invalid deck link.");
        }

        const actualDeckId = deckIdMatch[1];

        const url =
          `${API_BASE_URL}/tbotapp/user-decks/shared/` +
          `${encodeURIComponent(profile_slug)}/` +
          `${encodeURIComponent(actualDeckId)}/`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load this deck.");
        }

        if (!data?.deck) {
          throw new Error("That deck could not be found.");
        }

        setDeck(data.deck);

        setProfile({
          ...(data.profile || {}),
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load standalone deck:", err);

          setError(err.message || "Unable to load this deck.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDeck();

    return () => controller.abort();
  }, [profile_slug, deckId]);

  /*
   * Load card information.
   */
  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setAllCards(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [],
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load card information:", err);
        }
      }
    };

    fetchCards();

    return () => controller.abort();
  }, []);

  const profileName =
    normalizeText(profile?.display_name) ||
    normalizeText(profile?.username) ||
    "User";

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading deck</h2>

          <p>Preparing this decklist.</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="deck-page">
        <Navbar />

        <main className="deck-content">
          <div className="user-decklists-empty">
            <h2>Unable to load deck</h2>

            <p>{error || "This deck could not be found."}</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="deck-page">
      <Navbar />

      <main className="deck-content">
        <div className="user-decklists-header">
          <div className="user-decklists-profile">
            <div className="user-decklists-profile-info">
              <h1>{deck.name || "Untitled Deck"}</h1>

              <p>Shared by {profileName}</p>
            </div>
          </div>
        </div>

        <div className="deck-grid">
          <DeckCard
            decklist={deck}
            allCards={allCards}
            profileSlug={normalizeText(profile?.profile_slug) || profile_slug}
            profileIsPublic={false}
            autoOpen={true}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default StandaloneDeckPage;
