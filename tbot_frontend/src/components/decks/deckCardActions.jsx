import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeSide, normalizeKey } from "../../utils/deckFilters";
import { API_BASE_URL } from "../../utils/api";

function CustomDropdown({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  useEffect(() => {
    if (!open) return;

    const close = (event) => {
      if (event.type === "keydown" && event.key === "Escape") {
        setOpen(false);
      } else if (
        event.type === "pointerdown" &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);

    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div
      className={`suggestion-dropdown${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}
      ref={dropdownRef}
    >
      <span className="suggestion-dropdown-label">{label}</span>
      <button
        type="button"
        className="suggestion-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={!selectedOption ? "placeholder" : ""}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="suggestion-dropdown-chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && !disabled && (
        <div
          className="suggestion-dropdown-menu"
          role="listbox"
          aria-label={label}
        >
          {options.length ? (
            options.map((option) => {
              const selected = String(option.value) === String(value);

              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`suggestion-dropdown-option${selected ? " selected" : ""}`}
                  key={String(option.value)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="suggestion-dropdown-option-content">
                    {option.image && (
                      <img
                        className="suggestion-dropdown-option-image"
                        src={option.image}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <span className="suggestion-dropdown-option-name">
                      {option.label}
                    </span>
                  </span>
                  {selected && (
                    <span
                      className="suggestion-dropdown-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="suggestion-dropdown-empty">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeckCardActions({
  isAdmin,
  copied,
  onShare,
  showSuggestDeck,
  checkingLogin,
  suggesting,
  suggestStatus,
  onSuggestDeck,
  deckHasImage,
  onDownload,
  side,
  hero,
  hideShare = false,
  onSaveDeck,
  savingDeck = false,
  deckSaved = false,
  isSavedDeck = false,
  publishedDecks = [],
}) {
  const [showSuggestConfirmation, setShowSuggestConfirmation] = useState(false);
  const [suggestionType, setSuggestionType] = useState("new");
  const [selectedSide, setSelectedSide] = useState("");
  const [selectedHero, setSelectedHero] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [fetchedDecks, setFetchedDecks] = useState([]);
  const [loadingPublishedDecks, setLoadingPublishedDecks] = useState(false);
  const [publishedDeckLoadFailed, setPublishedDeckLoadFailed] = useState(false);

  const incomingDecks = useMemo(() => {
    if (Array.isArray(publishedDecks)) return publishedDecks;
    if (Array.isArray(publishedDecks?.results)) return publishedDecks.results;
    return [];
  }, [publishedDecks]);

  const getDeckId = (deck) => deck?.deckid ?? deck?.deckID ?? deck?.id;

  const hasUsableDecks = incomingDecks.some(
    (deck) =>
      deck?.side &&
      deck?.hero &&
      getDeckId(deck) != null &&
      String(deck?.name ?? "").trim(),
  );

  useEffect(() => {
    if (hasUsableDecks) {
      setFetchedDecks([]);
      setPublishedDeckLoadFailed(false);
      setLoadingPublishedDecks(false);
      return undefined;
    }

    let cancelled = false;

    async function loadDecks() {
      setLoadingPublishedDecks(true);
      setPublishedDeckLoadFailed(false);

      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/decklists/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        if (!cancelled) {
          setFetchedDecks(results);
          setPublishedDeckLoadFailed(results.length === 0);
        }
      } catch (error) {
        console.error("Failed to load published decks:", error);
        if (!cancelled) {
          setFetchedDecks([]);
          setPublishedDeckLoadFailed(true);
        }
      } finally {
        if (!cancelled) setLoadingPublishedDecks(false);
      }
    }

    void loadDecks();

    return () => {
      cancelled = true;
    };
  }, [hasUsableDecks]);

  const decks = useMemo(
    () => (hasUsableDecks ? incomingDecks : fetchedDecks),
    [hasUsableDecks, incomingDecks, fetchedDecks],
  );
  console.log(
    "Published deck field values:",
    decks.slice(0, 10).map((deck) => ({
      id: deck.deckid ?? deck.deckID ?? deck.id,
      name: deck.name,
      side: deck.side,
      hero: deck.hero,
      keys: Object.keys(deck),
    })),
  );
  const sides = useMemo(() => {
    const found = new Set();

    decks.forEach((deck) => {
      const side = normalizeSide(deck?.side);
      if (side === "plants" || side === "zombies") found.add(side);
    });

    return ["plants", "zombies"]
      .filter((side) => found.has(side))
      .map((side) => ({
        value: side,
        label: side === "plants" ? "Plants" : "Zombies",
      }));
  }, [decks]);
  const openSuggestConfirmation = () => {
    setSuggestionType("new");
    setSelectedSide(normalizeSide(side));
    setSelectedHero(String(hero ?? "").trim());
    setSelectedDeckId("");
    setShowSuggestConfirmation(true);
  };
  const heroes = useMemo(() => {
    if (!selectedSide) return [];

    const side = normalizeSide(selectedSide);

    return [
      ...new Set(
        decks
          .filter((deck) => normalizeSide(deck.side) === side)
          .map((deck) => String(deck.hero ?? "").trim())
          .filter(Boolean),
      ),
    ]
      .sort((a, b) => a.localeCompare(b))
      .map((hero) => ({
        value: hero,
        label: hero,
      }));
  }, [decks, selectedSide]);

  const matchingDecks = useMemo(() => {
    if (!selectedSide || !selectedHero) return [];

    return decks.filter(
      (deck) =>
        normalizeSide(deck.side) === normalizeSide(selectedSide) &&
        normalizeKey(deck.hero) === normalizeKey(selectedHero) &&
        getDeckId(deck) != null &&
        String(deck.name ?? "").trim(),
    );
  }, [decks, selectedSide, selectedHero]);

  const selectedDeck = useMemo(
    () =>
      decks.find(
        (deck) =>
          selectedDeckId !== "" &&
          String(getDeckId(deck)) === String(selectedDeckId),
      ) ?? null,
    [decks, selectedDeckId],
  );

  const deckOptions = useMemo(
    () =>
      matchingDecks.map((deck) => ({
        value: String(getDeckId(deck)),
        label: deck.name,
        image: deck.image_url ?? deck.image ?? deck.deck_image ?? "",
      })),
    [matchingDecks],
  );
  useEffect(() => {
    console.log("Published decks:", decks.length, decks.slice(0, 3));
    console.log("Selected deck ID:", selectedDeckId);
    console.log("Selected deck:", selectedDeck);
    console.log("Dropdown options:", { sides, heroes, deckOptions });
  }, [decks, selectedDeckId, selectedDeck, sides, heroes, deckOptions]);
  const isExistingDeckSelected =
    suggestionType === "update" && Boolean(selectedDeckId);

  const displayedSide = selectedDeck
    ? normalizeSide(selectedDeck.side)
    : selectedSide;

  const displayedHero = selectedDeck
    ? String(selectedDeck.hero ?? "").trim()
    : selectedHero;

  const sideOptions = useMemo(() => {
    if (
      !displayedSide ||
      sides.some((option) => option.value === displayedSide)
    ) {
      return sides;
    }

    return [
      ...sides,
      {
        value: displayedSide,
        label: displayedSide === "plants" ? "Plants" : "Zombies",
      },
    ];
  }, [sides, displayedSide]);

  const heroOptions = useMemo(() => {
    const options =
      selectedDeck && displayedHero
        ? [{ value: displayedHero, label: displayedHero }]
        : heroes;

    if (
      displayedHero &&
      !options.some(
        (option) => normalizeKey(option.value) === normalizeKey(displayedHero),
      )
    ) {
      return [...options, { value: displayedHero, label: displayedHero }];
    }

    return options;
  }, [selectedDeck, displayedHero, heroes]);

  const suggestionDisabled =
    suggesting ||
    checkingLogin ||
    [
      "success",
      "confirmed",
      "awaiting_creator",
      "already_suggested",
      "cooldown",
    ].includes(suggestStatus);

  const resetSelection = () => {
    setSelectedSide("");
    setSelectedHero("");
    setSelectedDeckId("");
  };

  const confirmSuggestion = () => {
    if (
      suggesting ||
      (suggestionType === "update" && (!selectedDeckId || !selectedDeck))
    ) {
      return;
    }

    setShowSuggestConfirmation(false);
    onSuggestDeck(
      suggestionType,
      suggestionType === "update" ? Number(selectedDeckId) : null,
    );
  };

  const closeSuggestionConfirmation = () => {
    if (suggesting) return;
    setShowSuggestConfirmation(false);
    setSuggestionType("new");
    resetSelection();
  };

  return (
    <>
      <div className="modal-actions">
        {!isAdmin && (
          <>
            {!hideShare && (
              <button type="button" className="share-btn" onClick={onShare}>
                {copied ? "Link Copied!" : "Share Deck"}
              </button>
            )}

            {showSuggestDeck && !checkingLogin && (
              <button
                type="button"
                className={`suggest-deck-btn ${suggesting ? "suggesting" : ""} ${suggestStatus ? `suggest-${suggestStatus}` : ""}`}
                onClick={openSuggestConfirmation}
                disabled={suggestionDisabled}
              >
                {suggesting
                  ? "Submitting..."
                  : ["success", "confirmed"].includes(suggestStatus)
                    ? "Deck Suggested!"
                    : suggestStatus === "awaiting_creator"
                      ? "Awaiting Creator Approval"
                      : suggestStatus === "already_suggested"
                        ? "Already Suggested"
                        : suggestStatus === "cooldown"
                          ? "Suggestion On Cooldown"
                          : suggestStatus === "denied"
                            ? "Suggestion Denied"
                            : "Suggest Deck"}
              </button>
            )}
          </>
        )}

        {!isAdmin && onSaveDeck && (
          <button
            type="button"
            className={`save-deck-btn ${deckSaved && !isSavedDeck ? "saved" : ""}`}
            onClick={onSaveDeck}
            disabled={
              checkingLogin || savingDeck || (deckSaved && !isSavedDeck)
            }
          >
            {checkingLogin
              ? "Checking Login..."
              : savingDeck
                ? isSavedDeck
                  ? "Removing..."
                  : "Saving..."
                : isSavedDeck
                  ? "Remove Saved Deck"
                  : deckSaved
                    ? "Deck Saved"
                    : "Save Deck"}
          </button>
        )}

        {deckHasImage && (
          <button type="button" className="download-btn" onClick={onDownload}>
            Download Decklist
          </button>
        )}
      </div>

      {showSuggestConfirmation && (
        <div
          className="suggest-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSuggestionConfirmation();
            }
          }}
        >
          <div
            className="suggest-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggest-confirm-title"
            aria-describedby="suggest-confirm-description"
          >
            <h3 id="suggest-confirm-title">Suggest Deck</h3>

            <p id="suggest-confirm-description">
              Choose whether to suggest a new deck or propose updates to an
              existing published deck. <br/>
              Make sure to check existing decks first because if your deck is too similar to one in the DB already you need to suggest it as an update.
            </p>

            <div className="suggestion-type-options">
              <button
                type="button"
                className={`suggestion-type-option${suggestionType === "new" ? " selected" : ""}`}
                aria-pressed={suggestionType === "new"}
                onClick={() => {
                  setSuggestionType("new");
                  resetSelection();
                }}
              >
                New Deck
              </button>

              <button
                type="button"
                className={`suggestion-type-option${suggestionType === "update" ? " selected" : ""}`}
                aria-pressed={suggestionType === "update"}
                onClick={() => {
                  setSuggestionType("update");
                  setSelectedSide(normalizeSide(side));
                  setSelectedHero(String(hero ?? "").trim());
                  setSelectedDeckId("");
                }}
              >
                Update Existing Deck
              </button>
            </div>

            {suggestionType === "new" ? (
              <p>
                This submits the deck as a new suggestion. If it is not your own
                deck, the creator may need to approve it.
              </p>
            ) : (
              <div className="suggestion-target-fields">
                <CustomDropdown
                  label="Side"
                  placeholder="Select side"
                  value={displayedSide}
                  options={sideOptions}
                  disabled={
                    suggestionType === "update" || Boolean(selectedDeck)
                  }
                  onChange={(value) => {
                    setSelectedSide(value);
                    setSelectedHero("");
                    setSelectedDeckId("");
                  }}
                />

                <CustomDropdown
                  label="Hero"
                  placeholder="Select hero"
                  value={displayedHero}
                  options={heroOptions}
                  disabled={
                    suggestionType === "update" ||
                    !selectedSide ||
                    Boolean(selectedDeck)
                  }
                  onChange={(value) => {
                    setSelectedHero(value);
                    setSelectedDeckId("");
                  }}
                />

                <CustomDropdown
                  label="Deck Name"
                  placeholder="Select deck"
                  value={selectedDeckId}
                  options={deckOptions}
                  disabled={!selectedHero || loadingPublishedDecks}
                  onChange={(value) => {
                    const deck = decks.find(
                      (item) => String(getDeckId(item)) === String(value),
                    );

                    if (!deck) return;

                    setSelectedSide(normalizeSide(deck.side));
                    setSelectedHero(String(deck.hero ?? "").trim());
                    setSelectedDeckId(String(getDeckId(deck)));
                  }}
                />

                {loadingPublishedDecks && <p>Loading published decks...</p>}

                {!loadingPublishedDecks &&
                  publishedDeckLoadFailed &&
                  decks.length === 0 && (
                    <p>
                      Could not load published decks. Please try again shortly.
                    </p>
                  )}

                {selectedHero &&
                  !loadingPublishedDecks &&
                  matchingDecks.length === 0 &&
                  !selectedDeck && (
                    <p>No published decks were found for this hero.</p>
                  )}
              </div>
            )}

            <div className="suggest-confirm-actions">
              <button
                type="button"
                className="suggest-confirm-cancel"
                onClick={closeSuggestionConfirmation}
                disabled={suggesting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="suggest-confirm-submit"
                onClick={confirmSuggestion}
                disabled={
                  suggesting ||
                  (suggestionType === "update" &&
                    (!selectedDeckId || !selectedDeck))
                }
              >
                {suggesting ? "Submitting..." : "Confirm Suggestion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeckCardActions;
