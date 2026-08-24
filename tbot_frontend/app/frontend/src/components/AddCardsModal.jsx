import { useEffect, useMemo, useState } from "react";

import "../css/addcardsmodal.css";

const getApiBaseUrl = () => {
  const envBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }

  return "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

const SIDES = ["Plants", "Zombie"];

export default function AddCardsModal({ isOpen, onClose, onCardsAdded }) {
  const [side, setSide] = useState("");
  const [cardClass, setCardClass] = useState("");
  const [search, setSearch] = useState("");

  const [classes, setClasses] = useState([]);
  const [cards, setCards] = useState([]);

  const [selectedCards, setSelectedCards] = useState({});

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------------------------------------------------------
  // Load classes when side changes
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!side) {
      setClasses([]);
      setCardClass("");
      return;
    }

    let cancelled = false;

    const loadClasses = async () => {
      setLoadingClasses(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/user-cards/classes/?side=${encodeURIComponent(
            side,
          )}`,
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load card classes.");
        }

        if (!cancelled) {
          setClasses(data.classes || []);
          setCardClass("");
        }
      } catch (err) {
        if (!cancelled) {
          setClasses([]);
          setError(err.message || "Unable to load card classes.");
        }
      } finally {
        if (!cancelled) {
          setLoadingClasses(false);
        }
      }
    };

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, [isOpen, side]);

  // ---------------------------------------------------------
  // Load cards
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isOpen || !side) {
      setCards([]);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(() => {
      const loadCards = async () => {
        setLoadingCards(true);
        setError("");

        try {
          const params = new URLSearchParams();

          params.set("side", side);

          if (cardClass) {
            params.set("class", cardClass);
          }

          if (search.trim()) {
            params.set("search", search.trim());
          }

          const response = await fetch(
            `${API_BASE_URL}/tbotapp/user-cards/available/?${params.toString()}`,
            {
              credentials: "include",
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Unable to load cards.");
          }

          if (!cancelled) {
            setCards(data.cards || []);
          }
        } catch (err) {
          if (!cancelled) {
            setCards([]);
            setError(err.message || "Unable to load cards.");
          }
        } finally {
          if (!cancelled) {
            setLoadingCards(false);
          }
        }
      };

      loadCards();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, side, cardClass, search]);

  // ---------------------------------------------------------
  // Reset modal
  // ---------------------------------------------------------

  const resetModal = () => {
    setSide("");
    setCardClass("");
    setSearch("");
    setClasses([]);
    setCards([]);
    setSelectedCards({});
    setError("");
    setSuccess("");
    setSaving(false);
  };

  const handleClose = () => {
    if (saving) {
      return;
    }

    resetModal();
    onClose?.();
  };

  // ---------------------------------------------------------
  // Select / deselect card
  // ---------------------------------------------------------

  const toggleCard = (card) => {
    if (card.already_owned) {
      return;
    }

    setSelectedCards((current) => {
      const next = {
        ...current,
      };

      if (next[card.card_name]) {
        delete next[card.card_name];
      } else {
        next[card.card_name] = {
          card_name: card.card_name,
          quantity: 1,
          card,
        };
      }

      return next;
    });
  };

  // ---------------------------------------------------------
  // Quantity
  // ---------------------------------------------------------

  const updateQuantity = (cardName, quantity) => {
    let parsed = Number.parseInt(quantity, 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
      parsed = 1;
    }

    setSelectedCards((current) => ({
      ...current,
      [cardName]: {
        ...current[cardName],
        quantity: parsed,
      },
    }));
  };

  const increaseQuantity = (cardName) => {
    const current = selectedCards[cardName];

    if (!current) {
      return;
    }

    updateQuantity(cardName, current.quantity + 1);
  };

  const decreaseQuantity = (cardName) => {
    const current = selectedCards[cardName];

    if (!current) {
      return;
    }

    updateQuantity(cardName, Math.max(1, current.quantity - 1));
  };

  // ---------------------------------------------------------
  // Selected cards
  // ---------------------------------------------------------

  const selectedList = useMemo(
    () => Object.values(selectedCards),
    [selectedCards],
  );

  const selectedCount = selectedList.length;

  const selectedQuantity = selectedList.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  // ---------------------------------------------------------
  // Add cards
  // ---------------------------------------------------------

  const handleSubmit = async () => {
    if (!selectedList.length) {
      setError("Select at least one card.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/tbotapp/user-cards/create/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cards: selectedList.map((item) => ({
              card_name: item.card_name,
              quantity: item.quantity,
            })),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.already_owned?.length) {
          const names = data.already_owned
            .map((card) => card.card_name)
            .join(", ");

          throw new Error(`Already in your collection: ${names}`);
        }

        throw new Error(data.error || "Unable to add cards.");
      }

      setSuccess(
        `${data.created} card${
          data.created === 1 ? "" : "s"
        } added successfully.`,
      );

      if (onCardsAdded) {
        await onCardsAdded(data.cards || []);
      }

      setSelectedCards({});

      // Refresh available cards so newly-added cards
      // disappear from the selection list.
      const params = new URLSearchParams();

      params.set("side", side);

      if (cardClass) {
        params.set("class", cardClass);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const refreshResponse = await fetch(
        `${API_BASE_URL}/tbotapp/user-cards/available/?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();

        setCards(refreshData.cards || []);
      }
    } catch (err) {
      setError(err.message || "Unable to add cards.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="add-cards-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="add-cards-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-cards-title"
      >
        <div className="add-cards-modal-header">
          <div>
            <h2 id="add-cards-title">Add Cards</h2>

            <p>Select cards to add to your collection.</p>
          </div>

          <button
            type="button"
            className="add-cards-close"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="add-cards-modal-body">
          {error && <div className="add-cards-error">{error}</div>}

          {success && <div className="add-cards-success">{success}</div>}

          <div className="add-cards-filters">
            <div className="add-cards-field">
              <label htmlFor="add-card-side">Side</label>

              <select
                id="add-card-side"
                value={side}
                onChange={(event) => {
                  setSide(event.target.value);
                  setSelectedCards({});
                  setSearch("");
                  setError("");
                  setSuccess("");
                }}
                disabled={saving}
              >
                <option value="">Select side</option>

                {SIDES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="add-cards-field">
              <label htmlFor="add-card-class">Class</label>

              <select
                id="add-card-class"
                value={cardClass}
                onChange={(event) => {
                  setCardClass(event.target.value);
                  setSelectedCards({});
                  setError("");
                  setSuccess("");
                }}
                disabled={!side || loadingClasses || saving}
              >
                <option value="">All classes</option>

                {classes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="add-cards-search">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setError("");
              }}
              placeholder={side ? "Search cards..." : "Select a side first"}
              disabled={!side || saving}
            />
          </div>

          <div className="add-cards-layout">
            <div className="add-cards-results">
              <div className="add-cards-section-header">
                <h3>Available Cards</h3>

                <span>{cards.length}</span>
              </div>

              {!side && (
                <div className="add-cards-empty">
                  Select a side to view cards.
                </div>
              )}

              {side && loadingCards && (
                <div className="add-cards-empty">Loading cards...</div>
              )}

              {side && !loadingCards && cards.length === 0 && (
                <div className="add-cards-empty">No cards found.</div>
              )}

              {!loadingCards &&
                cards.map((card) => {
                  const selected = Boolean(selectedCards[card.card_name]);

                  return (
                    <button
                      type="button"
                      key={card.cardid}
                      className={`add-card-row ${selected ? "selected" : ""} ${
                        card.already_owned ? "already-owned" : ""
                      }`}
                      onClick={() => toggleCard(card)}
                      disabled={card.already_owned || saving}
                    >
                      <div className="add-card-row-image">
                        {card.thumbnail ? (
                          <img src={card.thumbnail} alt="" />
                        ) : (
                          <div className="add-card-no-image">?</div>
                        )}
                      </div>

                      <div className="add-card-row-info">
                        <strong>{card.card_name}</strong>

                        {card.traits && <span>{card.traits}</span>}
                      </div>

                      <div className="add-card-row-status">
                        {card.already_owned
                          ? "Owned"
                          : selected
                            ? "Selected"
                            : "+"}
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="add-cards-selected">
              <div className="add-cards-section-header">
                <h3>Selected</h3>

                <span>{selectedCount}</span>
              </div>

              {selectedList.length === 0 ? (
                <div className="add-cards-empty">
                  Select cards from the list.
                </div>
              ) : (
                <div className="add-cards-selected-list">
                  {selectedList.map((item) => (
                    <div className="selected-card-row" key={item.card_name}>
                      <div className="selected-card-info">
                        <strong>{item.card_name}</strong>
                      </div>

                      <div className="selected-card-quantity">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.card_name)}
                          disabled={saving}
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(item.card_name, event.target.value)
                          }
                          disabled={saving}
                        />

                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.card_name)}
                          disabled={saving}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="selected-card-remove"
                        onClick={() => {
                          setSelectedCards((current) => {
                            const next = {
                              ...current,
                            };

                            delete next[item.card_name];

                            return next;
                          });
                        }}
                        disabled={saving}
                        aria-label={`Remove ${item.card_name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="add-cards-modal-footer">
          <div className="add-cards-summary">
            <strong>{selectedCount}</strong> card
            {selectedCount === 1 ? "" : "s"} selected
            {selectedCount > 0 && (
              <>
                {" "}
                · <strong>{selectedQuantity}</strong> total
              </>
            )}
          </div>

          <div className="add-cards-actions">
            <button
              type="button"
              className="add-cards-cancel"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="add-cards-submit"
              onClick={handleSubmit}
              disabled={saving || selectedList.length === 0}
            >
              {saving ? "Adding..." : "Add Selected Cards"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
