import { useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import DeckCard from "../components/deckcomponent";

import Navbar from "../components/navbar";

import Footer from "../components/footer";

import "../css/decklists.css";

import "../css/navbar.css";

import "../css/loading.css";

import "../css/userdecklists.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(
    import.meta.env.VITE_API_BASE_URL || "",
  ).trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const normalizeText = (value) =>
  String(value ?? "").trim();

const getDeckId = (deck) =>
  String(
    deck?.deckid ??
      deck?.deckID ??
      deck?.deckId ??
      deck?.id ??
      "",
  ).trim();

function StandaloneDeckPage() {
  const {
    profile_slug,
    deckId,
  } = useParams();

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

  useEffect(() => {
    const controller =
      new AbortController();

    const loadDeck = async () => {
      try {
        setLoading(true);
        setError("");

        if (!profile_slug || !deckId) {
          throw new Error(
            "Invalid deck link.",
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(
            profile_slug,
          )}/decks/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            signal: controller.signal,
          },
        );

        const data =
          await response.json().catch(
            () => null,
          );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to load this deck.",
          );
        }

        const returnedDecks =
          Array.isArray(data?.decks)
            ? data.decks
            : [];

        const requestedDeckId =
          String(deckId).trim();

        const matchedDeck =
          returnedDecks.find(
            (item) =>
              getDeckId(item) ===
              requestedDeckId,
          );

        if (!matchedDeck) {
          throw new Error(
            "That deck could not be found.",
          );
        }

        setProfile({
          ...(data?.profile || {}),
          is_owner:
            data?.is_owner === true,
        });

        setDeck(matchedDeck);
      } catch (err) {
        if (
          err.name !== "AbortError"
        ) {
          console.error(
            "Unable to load standalone deck:",
            err,
          );

          setError(
            err.message ||
              "Unable to load this deck.",
          );
        }
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    };

    loadDeck();

    return () =>
      controller.abort();
  }, [profile_slug, deckId]);

  useEffect(() => {
    const controller =
      new AbortController();

    const fetchCards = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/cardinfo/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setAllCards(
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.results,
              )
            ? data.results
            : [],
        );
      } catch (err) {
        if (
          err.name !== "AbortError"
        ) {
          console.error(
            "Unable to load card information:",
            err,
          );
        }
      }
    };

    fetchCards();

    return () =>
      controller.abort();
  }, []);

  const profileName = useMemo(
    () =>
      profile?.display_name ||
      profile?.username ||
      "User",
    [profile],
  );

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>
            Loading deck
          </h2>

          <p>
            Preparing this decklist.
          </p>
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
            <h2>
              Unable to load deck
            </h2>

            <p>
              {error ||
                "This deck could not be found."}
            </p>
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
              <h1>
                {deck.name ||
                  "Untitled Deck"}
              </h1>

              <p>
                Shared by{" "}
                {profileName}
              </p>
            </div>
          </div>
        </div>

        <div className="deck-grid">
          <DeckCard
            decklist={deck}
            allCards={allCards}
            profileSlug={
              normalizeText(
                profile?.profile_slug,
              ) ||
              profile_slug
            }
            profileIsPublic={
              profile?.is_public === true
            }
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default StandaloneDeckPage;