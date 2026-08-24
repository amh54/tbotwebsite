import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "../components/navbar";
import Footer from "../components/footer";

import "../css/cardmanager.css";
import "../css/loading.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  return "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

const SIDE_OPTIONS = [
  {
    value: "Plants",
    label: "Plants",
  },
  {
    value: "Zombie",
    label: "Zombies",
  },
];

const MAX_QUANTITY = 4;

const getCookie = (name) => {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const cookie of cookies) {
    const trimmed = cookie.trim();

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }

  return null;
};
const ensureCsrfToken = async () => {
  let token = getCsrfToken();

  if (token) {
    return token;
  }

  const response = await fetch(
    `${API_BASE_URL}/tbotapp/csrf/`,
    {
      method: "GET",
      credentials: "include",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    }
  );

  console.log("CSRF RESPONSE:", response.status);
  console.log("SET COOKIE HEADER:", response.headers.get("set-cookie"));

  if (!response.ok) {
    throw new Error("Unable to get CSRF cookie");
  }

  // give browser time to save cookie
  await new Promise((resolve) => setTimeout(resolve, 100));

  token = getCsrfToken();

  console.log("CSRF COOKIE AFTER FETCH:", token);

  if (!token) {
    throw new Error("CSRF cookie was not created");
  }

  return token;
};
const getCsrfToken = () => getCookie("csrftoken");

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.detail ||
      `Request failed with status ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

const getQuantityValue = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(MAX_QUANTITY, Math.max(0, parsed));
};

const getSelectedQuantity = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(MAX_QUANTITY, Math.max(1, parsed));
};

const getCardKey = (card) => {
  return String(card.cardid ?? card.card_id ?? card.card_name);
};
const UserCardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [savingCardId, setSavingCardId] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedSide, setSelectedSide] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");

  const [classes, setClasses] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);

  const [selectedCards, setSelectedCards] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [addingCards, setAddingCards] = useState(false);
  const setAllVisibleToFour = () => {
    if (!availableCards.length) {
      return;
    }

    const nextSelected = {};
    const nextQuantities = {
      ...selectedQuantities,
    };

    availableCards.forEach((card) => {
      const key = getCardKey(card);

      if (card.already_owned) {
        return;
      }

      nextSelected[key] = true;
      nextQuantities[key] = MAX_QUANTITY;
    });

    setSelectedCards(nextSelected);
    setSelectedQuantities(nextQuantities);
  };
  const loadCollection = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await requestJson(`${API_BASE_URL}/tbotapp/user-cards/`);

      if (!data.authenticated) {
        throw new Error(data.error || "You must be logged in.");
      }

      setCards(Array.isArray(data.cards) ? data.cards : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load your card collection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClasses = useCallback(async (side) => {
    if (!side) {
      setClasses([]);
      return;
    }

    setLoadingClasses(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("side", side);

      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/classes/?${params.toString()}`,
      );

      setClasses(Array.isArray(data.classes) ? data.classes : []);
    } catch (requestError) {
      setClasses([]);
      setError(requestError.message || "Unable to load card classes.");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadAvailableCards = useCallback(async () => {
    /*
     * Do not display cards until BOTH side and class have been selected.
     */
    if (!selectedSide || !selectedClass) {
      setAvailableCards([]);
      setLoadingCards(false);
      return;
    }

    setLoadingCards(true);

    try {
      const params = new URLSearchParams();

      params.set("side", selectedSide);
      params.set("class", selectedClass);

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/available/?${params.toString()}`,
      );

      setAvailableCards(Array.isArray(data.cards) ? data.cards : []);
    } catch (requestError) {
      setAvailableCards([]);
      setError(requestError.message || "Unable to load available cards.");
    } finally {
      setLoadingCards(false);
    }
  }, [selectedSide, selectedClass, search]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  useEffect(() => {
    if (!isAddModalOpen) {
      return;
    }

    loadClasses(selectedSide);
  }, [isAddModalOpen, selectedSide, loadClasses]);

  useEffect(() => {
    if (!isAddModalOpen) {
      return;
    }

    /*
     * Explicitly clear the card list while a class has not been selected.
     */
    if (!selectedSide || !selectedClass) {
      setAvailableCards([]);
      setLoadingCards(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      loadAvailableCards();
    }, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isAddModalOpen, selectedSide, selectedClass, search, loadAvailableCards]);

  const ownedCount = useMemo(() => {
    return cards.length;
  }, [cards]);

  const totalQuantity = useMemo(() => {
    return cards.reduce(
      (total, card) => total + getQuantityValue(card.quantity),
      0,
    );
  }, [cards]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedCards).filter(Boolean).length;
  }, [selectedCards]);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const resetAddModalState = () => {
    setSelectedSide("");
    setSelectedClass("");
    setSearch("");
    setClasses([]);
    setAvailableCards([]);
    setSelectedCards({});
    setSelectedQuantities({});
  };

  const openAddModal = () => {
    clearMessages();
    resetAddModalState();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    if (addingCards) {
      return;
    }

    setIsAddModalOpen(false);
    resetAddModalState();
  };

  const handleSideChange = (side) => {
    clearMessages();

    setSelectedSide(side);
    setSelectedClass("");
    setSearch("");

    setSelectedCards({});
    setSelectedQuantities({});
    setAvailableCards([]);
  };

  const handleClassChange = (cardClass) => {
    clearMessages();

    setSelectedClass(cardClass);
    setSelectedCards({});
    setSelectedQuantities({});
    setAvailableCards([]);
  };

  const toggleCardSelection = (card) => {
    if (card.already_owned) {
      return;
    }

    const key = getCardKey(card);

    setSelectedCards((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setSelectedQuantities((current) => {
      if (current[key] !== undefined) {
        return current;
      }

      return {
        ...current,
        [key]: 1,
      };
    });
  };

  const increaseSelectedQuantity = (card) => {
    const key = getCardKey(card);

    setSelectedQuantities((current) => {
      const currentQuantity = getSelectedQuantity(current[key] ?? 1);

      return {
        ...current,
        [key]: Math.min(MAX_QUANTITY, currentQuantity + 1),
      };
    });
  };

  const decreaseSelectedQuantity = (card) => {
    const key = getCardKey(card);

    setSelectedQuantities((current) => {
      const currentQuantity = getSelectedQuantity(current[key] ?? 1);

      return {
        ...current,
        [key]: Math.max(1, currentQuantity - 1),
      };
    });
  };

  const setSelectedQuantity = (card, value) => {
    const key = getCardKey(card);
    const quantity = getSelectedQuantity(value);

    setSelectedQuantities((current) => ({
      ...current,
      [key]: quantity,
    }));
  };

  const selectAllVisible = () => {
    if (!availableCards.length) {
      return;
    }

    const nextSelected = {};
    const nextQuantities = {
      ...selectedQuantities,
    };

    availableCards.forEach((card) => {
      const key = getCardKey(card);

      if (card.already_owned) {
        return;
      }

      nextSelected[key] = true;

      if (nextQuantities[key] === undefined) {
        nextQuantities[key] = 1;
      }
    });

    setSelectedCards(nextSelected);
    setSelectedQuantities(nextQuantities);
  };

  const clearSelectedCards = () => {
    setSelectedCards({});
  };

  const handleAddSelected = async () => {
    const selected = availableCards.filter(
      (card) => selectedCards[getCardKey(card)] && !card.already_owned,
    );

    if (!selected.length) {
      setError("Select at least one card to add.");
      return;
    }

    setAddingCards(true);
    clearMessages();

    let addedCount = 0;
    const failedCards = [];

    try {
      const csrfToken = await ensureCsrfToken();

      for (const card of selected) {
        const key = getCardKey(card);

        const quantity = getSelectedQuantity(selectedQuantities[key] ?? 1);

        try {
          await requestJson(`${API_BASE_URL}/tbotapp/user-cards/create/`, {
            method: "POST",
            headers: {
              "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify({
              card_name: card.card_name,
              quantity,
            }),
          });

          addedCount++;
        } catch (requestError) {
          failedCards.push(`${card.card_name}: ${requestError.message}`);
        }
      }

      await loadCollection();

      if (failedCards.length) {
        setError(
          `Added ${addedCount} cards, but failed: ${failedCards.join(" | ")}`,
        );
      } else {
        setSuccessMessage(`${addedCount} cards added to your collection.`);

        setIsAddModalOpen(false);
        resetAddModalState();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingCards(false);
    }
  };

  const handleQuantityChange = (cardId, value) => {
    const quantity = Math.min(
      MAX_QUANTITY,
      Math.max(0, Number.parseInt(value, 10) || 0),
    );

    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              quantity,
            }
          : card,
      ),
    );
  };

  const saveQuantity = async (card) => {
    const quantity = getQuantityValue(card.quantity);

    setSavingCardId(card.id);
    clearMessages();

    try {
      const csrfToken = getCsrfToken();

      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/${card.id}/`,
        {
          method: "PATCH",
          headers: csrfToken
            ? {
                "X-CSRFToken": csrfToken,
              }
            : {},
          body: JSON.stringify({
            quantity,
          }),
        },
      );

      setCards((current) =>
        current.map((item) =>
          item.id === card.id
            ? {
                ...item,
                quantity: data.quantity ?? quantity,
              }
            : item,
        ),
      );

      setSuccessMessage(`${card.card_name} quantity updated.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update card quantity.");

      await loadCollection();
    } finally {
      setSavingCardId(null);
    }
  };

  const changeQuantity = (card, amount) => {
    const currentQuantity = getQuantityValue(card.quantity);

    const nextQuantity = Math.min(
      MAX_QUANTITY,
      Math.max(0, currentQuantity + amount),
    );

    handleQuantityChange(card.id, nextQuantity);
  };

  const handleDelete = async (card) => {
    const confirmed = window.confirm(
      `Remove ${card.card_name} from your collection?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingCardId(card.id);
    clearMessages();

    try {
      const csrfToken = getCsrfToken();

      await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/${card.id}/delete/`,
        {
          method: "DELETE",
          headers: csrfToken
            ? {
                "X-CSRFToken": csrfToken,
              }
            : {},
        },
      );

      setCards((current) => current.filter((item) => item.id !== card.id));

      setSuccessMessage(`${card.card_name} was removed from your collection.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to remove card.");
    } finally {
      setDeletingCardId(null);
    }
  };

  const renderCardRow = (card) => {
    const fullCard = card.card;
    const quantity = getQuantityValue(card.quantity);

    return (
      <div className="card-manager-row" key={card.id}>
        <div className="card-manager-row-info">
          {fullCard?.thumbnail ? (
            <img
              className="card-manager-thumbnail"
              src={fullCard.thumbnail}
              alt=""
            />
          ) : (
            <div className="card-manager-thumbnail-placeholder">
              {card.card_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}

          <div className="card-manager-card-details">
            <div className="card-manager-card-name">{card.card_name}</div>

            {fullCard && (
              <div className="card-manager-card-meta">
                <span>{fullCard.side || "Unknown side"}</span>
                <span>{fullCard.card_type || "Unknown class"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card-manager-controls">
          <button
            type="button"
            className="quantity-button"
            onClick={() => changeQuantity(card, -1)}
            disabled={
              quantity <= 0 ||
              savingCardId === card.id ||
              deletingCardId === card.id
            }
            aria-label={`Decrease ${card.card_name} quantity`}
          >
            −
          </button>

          <input
            type="number"
            min="0"
            max={MAX_QUANTITY}
            value={card.quantity}
            onChange={(event) =>
              handleQuantityChange(card.id, event.target.value)
            }
            className="quantity-input"
            disabled={savingCardId === card.id || deletingCardId === card.id}
          />

          <button
            type="button"
            className="quantity-button"
            onClick={() => changeQuantity(card, 1)}
            disabled={
              quantity >= MAX_QUANTITY ||
              savingCardId === card.id ||
              deletingCardId === card.id
            }
            aria-label={`Increase ${card.card_name} quantity`}
          >
            +
          </button>

          <button
            type="button"
            className="card-save-button"
            onClick={() => saveQuantity(card)}
            disabled={savingCardId === card.id || deletingCardId === card.id}
          >
            {savingCardId === card.id ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            className="card-delete-button"
            onClick={() => handleDelete(card)}
            disabled={savingCardId === card.id || deletingCardId === card.id}
          >
            {deletingCardId === card.id ? "Removing..." : "Delete"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="card-manager-page">
      <Navbar />

      <main className="card-manager-content">
        <div className="card-manager-header">
          <div>
            <h1>Card Manager</h1>
            <p>Manage the cards in your collection.</p>
          </div>

          <button
            type="button"
            className="add-cards-button"
            onClick={openAddModal}
          >
            Add Cards
          </button>
        </div>

        {error && <div className="card-manager-message error">{error}</div>}

        {successMessage && (
          <div className="card-manager-message success">{successMessage}</div>
        )}

        <section className="card-manager-summary">
          <div className="summary-item">
            <span className="summary-label">Unique Cards</span>
            <strong>{ownedCount}</strong>
          </div>

          <div className="summary-item">
            <span className="summary-label">Total Copies</span>
            <strong>{totalQuantity}</strong>
          </div>
        </section>

        <section className="card-manager-list-section">
          <div className="card-manager-section-header">
            <div>
              <h2>My Collection</h2>

              <span>
                {ownedCount} unique card
                {ownedCount === 1 ? "" : "s"}
              </span>
            </div>

            <button
              type="button"
              className="secondary-add-button"
              onClick={openAddModal}
            >
              + Add Cards
            </button>
          </div>

          {loading ? (
            <div className="card-manager-loading">
              Loading your collection...
            </div>
          ) : cards.length === 0 ? (
            <div className="card-manager-empty">
              <h3>Your collection is empty</h3>

              <p>Add cards to start building your collection.</p>

              <button
                type="button"
                className="add-cards-button"
                onClick={openAddModal}
              >
                Add Cards
              </button>
            </div>
          ) : (
            <div className="card-manager-list">{cards.map(renderCardRow)}</div>
          )}
        </section>
      </main>

      <Footer />

      {isAddModalOpen && (
        <div
          className="card-manager-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div
            className="card-manager-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-cards-title"
          >
            <div className="card-manager-modal-header">
              <div>
                <h2 id="add-cards-title">Add Cards</h2>

                <p>
                  Select a side and class, then choose the cards you want to
                  add.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeAddModal}
                disabled={addingCards}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="card-manager-filters">
              <div className="filter-group">
                <label htmlFor="card-side">Side</label>

                <select
                  id="card-side"
                  value={selectedSide}
                  onChange={(event) => handleSideChange(event.target.value)}
                  disabled={addingCards}
                >
                  <option value="">Select side</option>

                  {SIDE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="card-class">Class</label>

                <select
                  id="card-class"
                  value={selectedClass}
                  onChange={(event) => handleClassChange(event.target.value)}
                  disabled={!selectedSide || loadingClasses || addingCards}
                >
                  <option value="">
                    {!selectedSide
                      ? "Select side first..."
                      : loadingClasses
                        ? "Loading classes..."
                        : "Select class..."}
                  </option>

                  {classes.map((cardClass) => (
                    <option key={cardClass} value={cardClass}>
                      {cardClass}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group search-group">
                <label htmlFor="card-search">Search</label>

                <input
                  id="card-search"
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder={
                    selectedClass
                      ? "Search cards..."
                      : "Select a class first..."
                  }
                  disabled={!selectedClass || addingCards}
                />
              </div>
            </div>

            {!selectedSide ? (
              <div className="modal-empty-state">
                <h3>Choose a side to begin</h3>

                <p>Select Plants or Zombies to load the available classes.</p>
              </div>
            ) : !selectedClass ? (
              <div className="modal-empty-state">
                <h3>Choose a class to see cards</h3>

                <p>
                  Select a class above before the available cards are displayed.
                </p>
              </div>
            ) : (
              <>
                <div className="available-cards-toolbar">
                  <span>
                    {loadingCards
                      ? "Loading cards..."
                      : `${availableCards.length} card${
                          availableCards.length === 1 ? "" : "s"
                        }`}
                  </span>

                  <div className="selection-actions">
                    <button
                      type="button"
                      onClick={selectAllVisible}
                      disabled={
                        loadingCards || !availableCards.length || addingCards
                      }
                    >
                      Select Available
                    </button>

                    <button
                      type="button"
                      onClick={setAllVisibleToFour}
                      disabled={
                        loadingCards || !availableCards.length || addingCards
                      }
                    >
                      Set All +4
                    </button>

                    <button
                      type="button"
                      onClick={clearSelectedCards}
                      disabled={selectedCount === 0 || addingCards}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="available-card-list">
                  {loadingCards ? (
                    <div className="modal-loading">
                      Loading available cards...
                    </div>
                  ) : availableCards.length === 0 ? (
                    <div className="modal-empty-state small">
                      <h3>No cards found</h3>

                      <p>Try another class or search term.</p>
                    </div>
                  ) : (
                    availableCards.map((card) => {
                      const key = getCardKey(card);
                      const isSelected = Boolean(selectedCards[key]);
                      const quantity = getSelectedQuantity(
                        selectedQuantities[key] ?? 1,
                      );

                      return (
                        <div
                          className={`available-card-row ${
                            isSelected ? "selected" : ""
                          } ${card.already_owned ? "already-owned" : ""}`}
                          key={key}
                          onClick={() => {
                            toggleCardSelection(card);
                          }}
                        >
                          <div className="available-card-main">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCardSelection(card)}
                              onClick={(event) => event.stopPropagation()}
                              disabled={card.already_owned || addingCards}
                            />

                            {card.thumbnail ? (
                              <img
                                src={card.thumbnail}
                                alt=""
                                className="available-card-thumbnail"
                              />
                            ) : (
                              <div className="available-card-thumbnail-placeholder">
                                {card.card_name?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}

                            <div className="available-card-info">
                              <strong>{card.card_name}</strong>

                              <span>{card.card_type}</span>
                            </div>
                          </div>

                          <div className="available-card-actions">
                            {card.already_owned ? (
                              <span className="already-owned-label">
                                Already Owned
                              </span>
                            ) : (
                              <div
                                className="card-ratio-controls"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="card-ratio-button"
                                  onClick={() => decreaseSelectedQuantity(card)}
                                  disabled={
                                    !isSelected || quantity <= 1 || addingCards
                                  }
                                  aria-label={`Decrease ${card.card_name} quantity`}
                                >
                                  −
                                </button>

                                <div className="card-ratio-count">
                                  {quantity}
                                </div>

                                <button
                                  type="button"
                                  className="card-ratio-button"
                                  onClick={() => increaseSelectedQuantity(card)}
                                  disabled={
                                    !isSelected ||
                                    quantity >= MAX_QUANTITY ||
                                    addingCards
                                  }
                                  aria-label={`Increase ${card.card_name} quantity`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            <div className="card-manager-modal-footer">
              <span className="selected-count">{selectedCount} selected</span>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={closeAddModal}
                  disabled={addingCards}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="modal-add-button"
                  onClick={handleAddSelected}
                  disabled={addingCards || selectedCount === 0}
                >
                  {addingCards
                    ? "Adding..."
                    : `Add ${selectedCount || ""} Selected`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCardManager;
