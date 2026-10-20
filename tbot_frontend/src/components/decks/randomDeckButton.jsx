import { useState } from "react";

export default function RandomDeckButton({
  decks = [],
  selectedDeckKey = null,
  onSelectDeck,
}) {
  const [lastSelectedKey, setLastSelectedKey] = useState(null);

  const handleRandomDeck = () => {
    if (!decks.length || typeof onSelectDeck !== "function") {
      return;
    }

    const previousKey = selectedDeckKey ?? lastSelectedKey;
    let candidates = decks;

    if (decks.length > 1 && previousKey !== null) {
      candidates = decks.filter(
        (deck) =>
          `${String(deck.side ?? "")}-${String(
            deck.deckid ??
              deck.deckID ??
              deck.deckId ??
              deck.id ??
              deck.name ??
              "",
          )}` !== previousKey,
      );

      if (!candidates.length) {
        candidates = decks;
      }
    }

    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);

    const deck =
      candidates[Math.floor((randomValues[0] / 2 ** 32) * candidates.length)];
    const key = `${String(deck.side ?? "")}-${String(
      deck.deckid ?? deck.deckID ?? deck.deckId ?? deck.id ?? deck.name ?? "",
    )}`;

    setLastSelectedKey(key);
    onSelectDeck(deck);
  };

  return (
    <button
      type="button"
      className="random-deck-btn"
      onClick={handleRandomDeck}
      disabled={!decks.length}
    >
      Random Deck
    </button>
  );
}
