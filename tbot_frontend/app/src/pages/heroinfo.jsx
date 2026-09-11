import { useEffect, useMemo, useState } from "react";

import CardModal from "../components/modals/cardmodal.jsx";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import HeroCard from "../components/heroInfo/heroCard.jsx";
import HeroLoading from "../components/heroInfo/heroLoading.jsx";

import { API_BASE_URL, CARD_CACHE_KEY } from "../utils/cardInfo/apiConfig.js";

import { getRarityName } from "../utils/cardInfo/dataUtils.js";

import { normalizeText } from "../utils/cardInfo/textUtils.js";

import { HERO_CACHE_KEY } from "../utils/heroInfo/heroConfig.js";

import {
  getCachedData,
  findHeroByQuery,
  getSideHeroes,
} from "../utils/heroInfo/heroUtils.js";

import { getSuperpowerCards } from "../utils/heroInfo/superpowerUtils.js";

import "../css/cardinfo.css";
import "../css/navbar.css";
import "../css/loading.css";

function HeroInfo() {
  const initialHeroCache = getCachedData(HERO_CACHE_KEY);

  const initialCardCache = getCachedData(CARD_CACHE_KEY);

  const [cards, setCards] = useState(initialHeroCache?.results || []);

  const [allCards, setAllCards] = useState(initialCardCache?.results || []);

  const [side, setSide] = useState("Plants");

  const [selectedCard, setSelectedCard] = useState(null);

  const [selectedIsHero, setSelectedIsHero] = useState(false);

  const [loading, setLoading] = useState(!initialHeroCache?.results?.length);

  const [error, setError] = useState("");

  const [totalHeroes, setTotalHeroes] = useState(
    Number(initialHeroCache?.count) || initialHeroCache?.results?.length || 0,
  );

  const openCardModal = (card, isHero = false) => {
    if (!card) {
      return;
    }

    setSelectedCard(card);
    setSelectedIsHero(isHero);

    const url = new URL(window.location.href);

    url.searchParams.set("card", card.card_name);

    window.history.pushState(
      {
        card: card.card_name,
      },
      "",
      url,
    );
  };

  useEffect(() => {
    document.title = "Hero Info";

    const faviconUrl = "https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp";

    let favicon = document.querySelector('link[rel="icon"]');

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = faviconUrl;

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadHeroes = async () => {
      let hasCachedHeroes = false;
      let hasCachedCards = false;

      try {
        setError("");

        const cachedHeroes = getCachedData(HERO_CACHE_KEY);

        if (cachedHeroes?.results?.length) {
          hasCachedHeroes = true;

          setCards(cachedHeroes.results);

          setTotalHeroes(
            Number(cachedHeroes.count) || cachedHeroes.results.length,
          );

          setLoading(false);
        }

        const cachedCards = getCachedData(CARD_CACHE_KEY);

        if (cachedCards?.results?.length) {
          hasCachedCards = true;

          setAllCards(cachedCards.results);
        }

        const requests = [];

        if (!hasCachedHeroes) {
          requests.push(
            fetch(`${API_BASE_URL}/tbotapp/heroinfo/`, {
              signal: controller.signal,
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(
                  `Hero request failed with status ${response.status}`,
                );
              }

              return response.json();
            }),
          );
        } else {
          requests.push(null);
        }

        if (!hasCachedCards) {
          requests.push(
            fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
              signal: controller.signal,
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(
                  `Card request failed with status ${response.status}`,
                );
              }

              return response.json();
            }),
          );
        } else {
          requests.push(null);
        }

        const [heroData, cardData] = await Promise.all(requests);

        if (heroData) {
          const heroResults = Array.isArray(heroData?.results)
            ? heroData.results
            : Array.isArray(heroData)
              ? heroData
              : [];

          const heroCount = Number(heroData?.count) || heroResults.length;

          if (heroResults.length > 0) {
            setCards(heroResults);
            setTotalHeroes(heroCount);

            sessionStorage.setItem(
              HERO_CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                count: heroCount,
                results: heroResults,
              }),
            );
          }
        }

        if (cardData) {
          const cardResults = Array.isArray(cardData)
            ? cardData
            : Array.isArray(cardData?.results)
              ? cardData.results
              : [];

          if (cardResults.length > 0) {
            setAllCards(cardResults);

            sessionStorage.setItem(
              CARD_CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                results: cardResults,
              }),
            );
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Hero loading failed:", err);

        if (!hasCachedHeroes) {
          setCards([]);
          setTotalHeroes(0);

          setError(
            `Unable to load heroes right now. ${err.message || ""}`.trim(),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadHeroes();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!cards.length) {
      return;
    }

    const sideHeroes = getSideHeroes(cards, side);

    sideHeroes.forEach((card) => {
      if (!card.thumbnail) {
        return;
      }

      const image = new Image();
      image.src = card.thumbnail;
    });
  }, [cards, side]);

  useEffect(() => {
    if (!cards.length) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    const cardName = params.get("card");

    if (!cardName) {
      return;
    }

    const foundCard = findHeroByQuery(cards, cardName);

    if (!foundCard) {
      return;
    }

    const normalizedSide = normalizeText(foundCard.side);

    if (normalizedSide === "zombie" || normalizedSide === "zombies") {
      setSide("Zombies");
    } else {
      setSide("Plants");
    }

    setSelectedCard(foundCard);
    setSelectedIsHero(true);
  }, [cards]);

  const heroes = useMemo(() => getSideHeroes(cards, side), [cards, side]);

  const handleHeroOpen = (card) => {
    openCardModal(card, true);
  };

  const handleSuperpowerOpen = (card) => {
    openCardModal(card);
  };

  if (loading) {
    return <HeroLoading totalHeroes={totalHeroes} />;
  }

  return (
    <>
      <Navbar />

      <div className="card-information-page">
        <h1>Hero Information</h1>

        <div className="card-side-tabs">
          <button
            type="button"
            className={side === "Plants" ? "active" : ""}
            onClick={() => setSide("Plants")}
          >
            Plants
          </button>

          <button
            type="button"
            className={side === "Zombies" ? "active" : ""}
            onClick={() => setSide("Zombies")}
          >
            Zombies
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {!error && (
          <>
            <h2>Heroes</h2>

            <p className="card-results-count">
              Showing {heroes.length} {side} heroes
            </p>

            {heroes.length === 0 ? (
              <p className="no-card-results">No {side} heroes found.</p>
            ) : (
              <div className="card-grid">
                {heroes.map((hero) => (
                  <HeroCard
                    key={hero.cardid}
                    hero={hero}
                    allCards={allCards}
                    getSuperpowerCards={getSuperpowerCards}
                    getRarityName={getRarityName}
                    onOpenHero={handleHeroOpen}
                    onOpenSuperpower={handleSuperpowerOpen}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {selectedCard && (
          <CardModal
            card={selectedCard}
            allCards={allCards}
            showShareCard={false}
            showShareHero={selectedIsHero}
            close={() => {
              if (window.history.state?.card) {
                window.history.back();
              } else {
                setSelectedCard(null);
                setSelectedIsHero(false);

                const url = new URL(window.location.href);

                url.searchParams.delete("card");

                window.history.replaceState({}, "", url);
              }
            }}
          />
        )}
      </div>

      <Footer credits="Special thanks to The_Cute_Chick, otherwise known as TCC, for uploading all of the hero images and transcribing most of the initial hero information used here." />
    </>
  );
}

export default HeroInfo;
