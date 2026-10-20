import { useEffect, useMemo, useState } from "react";

import CardModal from "../../components/modals/cardModal.jsx";
import Navbar from "../../components/navbar.jsx";
import Footer from "../../components/footer.jsx";
import HeroCard from "../../components/heroInfo/heroCard.jsx";
import HeroLoading from "../../components/heroInfo/heroLoading.jsx";
import { API_BASE_URL } from "../../utils/api.js";
import { CARD_CACHE_KEY } from "../../utils/cardInfo/cardCache.js";
import { getRarityName } from "../../utils/cardInfo/dataUtils.js";
import { normalizeText } from "../../utils/cardInfo/textUtils.js";
import { HERO_CACHE_KEY } from "../../utils/heroInfo/heroConfig.js";
import Seo from "../../components/seo.jsx";
import {
  getCachedData,
  findHeroByQuery,
  getSideHeroes,
} from "../../utils/heroInfo/heroUtils.js";

import { getSuperpowerCards } from "../../utils/heroInfo/superpowerUtils.js";

import "../../css/cardInfo.css";
import "../../css/navbar.css";
import "../../css/loading.css";
async function fetchJson(url, signal, label) {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`${label} request failed with status ${response.status}`);
  }

  return response.json();
}

function getResults(data) {
  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function saveCache(key, data) {
  sessionStorage.setItem(
    key,
    JSON.stringify({
      timestamp: Date.now(),
      ...data,
    }),
  );
}
function isAbortError(err) {
  return err.name === "AbortError";
}

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
  function applyHeroData(heroData) {
    if (!heroData) return;

    const heroResults = getResults(heroData);
    const heroCount = Number(heroData?.count) || heroResults.length;

    if (heroResults.length === 0) return;

    setCards(heroResults);
    setTotalHeroes(heroCount);

    saveCache(HERO_CACHE_KEY, {
      count: heroCount,
      results: heroResults,
    });
  }

  function applyCardData(cardData) {
    if (!cardData) return;

    const cardResults = getResults(cardData);

    if (cardResults.length === 0) return;

    setAllCards(cardResults);

    saveCache(CARD_CACHE_KEY, {
      results: cardResults,
    });
  }
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
    const controller = new AbortController();

    const loadHeroes = async () => {
      let hasCachedHeroes = false;
      let hasCachedCards = false;

      try {
        setError("");

        const cachedHeroes = getCachedData(HERO_CACHE_KEY);
        const cachedCards = getCachedData(CARD_CACHE_KEY);

        hasCachedHeroes = Boolean(cachedHeroes?.results?.length);
        hasCachedCards = Boolean(cachedCards?.results?.length);

        if (hasCachedHeroes) {
          setCards(cachedHeroes.results);
          setTotalHeroes(
            Number(cachedHeroes.count) || cachedHeroes.results.length,
          );
          setLoading(false);
        }

        if (hasCachedCards) {
          setAllCards(cachedCards.results);
        }

        const [heroData, cardData] = await Promise.all([
          hasCachedHeroes
            ? null
            : fetchJson(
                `${API_BASE_URL}/tbotapp/heroinfo/`,
                controller.signal,
                "Hero",
              ),
          hasCachedCards
            ? null
            : fetchJson(
                `${API_BASE_URL}/tbotapp/cardinfo/`,
                controller.signal,
                "Card",
              ),
        ]);

        applyHeroData(heroData);
        applyCardData(cardData);

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

    void loadHeroes();

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
      <Seo
        title="PVZH Heroes - PVZ Heroes Hero Database | Tbot"
        description="Browse the Plants vs. Zombies Heroes hero database on Tbot. Explore PVZH Plant and Zombie heroes, their superpowers, abilities, rarities, and card information."
        canonical="/heroinfo"
      />
      <Navbar />

      <div className="card-information-page">
        <h1>PVZ Heroes Hero Database</h1>

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
