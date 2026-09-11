import { useEffect, useMemo, useRef, useState } from "react";

import Select from "react-select";

import { API_BASE_URL } from "../../utils/api";

const MAX_QUANTITY = 4;

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

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#202020",
    borderColor: state.isFocused ? "#8fe38b" : "#444",
    minHeight: "45px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#8fe38b",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    minWidth: 0,
    flexWrap: "wrap",
    maxHeight: "140px",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  }),
  indicatorsContainer: (base) => ({
    ...base,
    alignSelf: "flex-start",
    flexShrink: 0,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#202020",
  }),
  menuList: (base) => ({
    ...base,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#333" : "#202020",
    color: "white",
    cursor: "pointer",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#333",
    maxWidth: "100%",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "white",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#aaa",
    "&:hover": {
      backgroundColor: "#555",
      color: "white",
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: "#888",
  }),
  input: (base) => ({
    ...base,
    color: "white",
  }),
};

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

const getCsrfToken = () => {
  return getCookie("csrftoken");
};

const ensureCsrfToken = async () => {
  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.detail ||
        `Unable to get CSRF token (${response.status})`,
    );
  }

  const token = data?.csrfToken || data?.csrf_token || getCsrfToken();

  if (!token) {
    throw new Error("Unable to obtain CSRF token");
  }

  return token;
};

const parseResponseData = async (response) => {
  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return data;
  }

  const text = await response.text();

  if (text) {
    data = {
      error: text
        .replaceAll("<", " ")
        .replaceAll(">", " ")
        .replace(/\s+/g, " ")
        .trim(),
    };
  }

  return data;
};

const requestJson = async (url, options = {}) => {
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    Accept: "application/json",
    ...(options.body
      ? {
          "Content-Type": "application/json",
        }
      : {}),
    ...options.header,
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    method,
    credentials: "include",
    headers,
  });

  const data = await parseResponseData(response);

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.detail ||
      data?.reason ||
      `Request failed with status ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

const getCardKey = (card) => {
  return String(card.cardid ?? card.card_id ?? card.card_name ?? "");
};

const getSelectedQuantity = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(MAX_QUANTITY, Math.max(1, parsed));
};

const getCardQuantity = (card, selectedQuantities) => {
  const key = getCardKey(card);

  return getSelectedQuantity(selectedQuantities[key] ?? 1);
};

const getCardClassName = (card, isSelected) => {
  const selectedClass = isSelected ? "selected" : "";
  const ownedClass = card.already_owned ? "already-owned" : "";

  return `available-card-row ${selectedClass} ${ownedClass}`;
};

const getCardThumbnail = (card) => {
  if (card.thumbnail) {
    return (
      <img src={card.thumbnail} alt="" className="available-card-thumbnail" />
    );
  }

  return (
    <div className="available-card-thumbnail-placeholder">
      {card.card_name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
};

function CardQuantityControls({
  card,
  isSelected,
  quantity,
  addingCards,
  onDecrease,
  onIncrease,
}) {
  return (
    <div className="card-ratio-controls">
      <button
        type="button"
        className="card-ratio-button"
        onClick={(event) => {
          event.stopPropagation();
          onDecrease(card);
        }}
        disabled={!isSelected || quantity <= 1 || addingCards}
        aria-label={`Decrease ${card.card_name} quantity`}
      >
        −
      </button>

      <div className="card-ratio-count">{quantity}</div>

      <button
        type="button"
        className="card-ratio-button"
        onClick={(event) => {
          event.stopPropagation();
          onIncrease(card);
        }}
        disabled={!isSelected || quantity >= MAX_QUANTITY || addingCards}
        aria-label={`Increase ${card.card_name} quantity`}
      >
        +
      </button>
    </div>
  );
}

function AvailableCardRow({
  card,
  selectedCards,
  selectedQuantities,
  addingCards,
  onToggle,
  onDecrease,
  onIncrease,
}) {
  const key = getCardKey(card);
  const isSelected = Boolean(selectedCards[key]);
  const quantity = getCardQuantity(card, selectedQuantities);
  const className = getCardClassName(card, isSelected);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(card);
    }
  };

  const cardActions = card.already_owned ? (
    <span className="already-owned-label">Already Owned</span>
  ) : (
    <CardQuantityControls
      card={card}
      isSelected={isSelected}
      quantity={quantity}
      addingCards={addingCards}
      onDecrease={onDecrease}
      onIncrease={onIncrease}
    />
  );

  return (
    <button
      type="button"
      className={className}
      key={key}
      disabled={card.already_owned}
      onClick={(event) => {
        if (event.target.closest(".card-ratio-controls")) {
          return;
        }

        onToggle(card);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="available-card-main">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(card)}
          onClick={(event) => event.stopPropagation()}
          disabled={card.already_owned || addingCards}
        />

        {getCardThumbnail(card)}

        <div className="available-card-info">
          <strong>{card.card_name}</strong>
          <span>{card.card_type}</span>
        </div>
      </div>

      <div className="available-card-actions">{cardActions}</div>
    </button>
  );
}

function CardListContent({
  loadingCards,
  availableCards,
  selectedCards,
  selectedQuantities,
  addingCards,
  onToggle,
  onDecrease,
  onIncrease,
}) {
  if (loadingCards) {
    return <div className="modal-loading">Loading available cards...</div>;
  }

  if (availableCards.length === 0) {
    return (
      <div className="modal-empty-state small">
        <h3>No cards found</h3>
        <p>Try another class or search term.</p>
      </div>
    );
  }

  return availableCards.map((card) => (
    <AvailableCardRow
      card={card}
      selectedCards={selectedCards}
      selectedQuantities={selectedQuantities}
      addingCards={addingCards}
      onToggle={onToggle}
      onDecrease={onDecrease}
      onIncrease={onIncrease}
      key={getCardKey(card)}
    />
  ));
}

function SelectionEmptyState({ selectedSides, selectedClasses }) {
  if (!selectedSides.length) {
    return (
      <div className="modal-empty-state">
        <h3>Choose a side to begin</h3>
        <p>Select Plants or Zombies to load the available classes.</p>
      </div>
    );
  }

  if (!selectedClasses.length) {
    return (
      <div className="modal-empty-state">
        <h3>Choose a class to see cards</h3>
        <p>
          Select at least one class above before the available cards are
          displayed.
        </p>
      </div>
    );
  }

  return null;
}

export default function AddCardsModal({ isOpen, onClose, onCardsAdded }) {
  const [selectedSides, setSelectedSides] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [addingCards, setAddingCards] = useState(false);
  const [error, setError] = useState("");

  const backdropRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!selectedSides.length) {
      setClasses([]);
      setSelectedClasses([]);
      return;
    }

    let cancelled = false;

    const loadClasses = async () => {
      setLoadingClasses(true);
      setError("");

      try {
        const params = new URLSearchParams();

        selectedSides.forEach((side) => {
          params.append("side", side.value);
        });

        const data = await requestJson(
          `${API_BASE_URL}/tbotapp/user-cards/classes/?${params.toString()}`,
        );

        if (!cancelled) {
          const classValues = Array.isArray(data?.classes) ? data.classes : [];

          setClasses(
            classValues.map((value) => ({
              value,
              label: value,
            })),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setClasses([]);
          setSelectedClasses([]);
          setError(requestError.message || "Unable to load card classes.");
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
  }, [isOpen, selectedSides]);

  useEffect(() => {
    if (!isOpen || !selectedSides.length || !selectedClasses.length) {
      setAvailableCards([]);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(() => {
      const loadAvailableCards = async () => {
        setLoadingCards(true);
        setError("");

        try {
          const params = new URLSearchParams();

          selectedSides.forEach((side) => {
            params.append("side", side.value);
          });

          selectedClasses.forEach((cardClass) => {
            params.append("class", cardClass.value);
          });

          if (search.trim()) {
            params.set("search", search.trim());
          }

          const data = await requestJson(
            `${API_BASE_URL}/tbotapp/user-cards/available/?${params.toString()}`,
          );

          if (!cancelled) {
            setAvailableCards(Array.isArray(data?.cards) ? data.cards : []);
          }
        } catch (requestError) {
          if (!cancelled) {
            setAvailableCards([]);
            setError(requestError.message || "Unable to load available cards.");
          }
        } finally {
          if (!cancelled) {
            setLoadingCards(false);
          }
        }
      };

      loadAvailableCards();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, selectedSides, selectedClasses, search]);

  const selectedCount = useMemo(() => {
    return Object.keys(selectedCards).length;
  }, [selectedCards]);

  const closeModal = () => {
    if (addingCards) {
      return;
    }

    setSelectedSides([]);
    setSelectedClasses([]);
    setSearch("");
    setClasses([]);
    setAvailableCards([]);
    setSelectedCards({});
    setSelectedQuantities({});
    setLoadingClasses(false);
    setLoadingCards(false);
    setError("");
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleBackdropMouseDown = (event) => {
      if (event.target === backdropRef.current) {
        closeModal();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleBackdropMouseDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleBackdropMouseDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, addingCards]);

  const getCardSelectionKey = (card) => {
    return getCardKey(card);
  };

  const getQuantityForCard = (card) => {
    const key = getCardSelectionKey(card);

    return getSelectedQuantity(selectedQuantities[key] ?? 1);
  };

  const toggleCardSelection = (card) => {
    if (card.already_owned || addingCards) {
      return;
    }

    const key = getCardSelectionKey(card);

    setSelectedCards((current) => {
      const next = {
        ...current,
      };

      if (next[key]) {
        delete next[key];
      } else {
        next[key] = card;
      }

      return next;
    });

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
    if (addingCards) {
      return;
    }

    const key = getCardSelectionKey(card);

    setSelectedQuantities((current) => ({
      ...current,
      [key]: Math.min(MAX_QUANTITY, getSelectedQuantity(current[key] ?? 1) + 1),
    }));
  };

  const decreaseSelectedQuantity = (card) => {
    if (addingCards) {
      return;
    }

    const key = getCardSelectionKey(card);
    const currentQuantity = getQuantityForCard(card);

    setSelectedQuantities((current) => ({
      ...current,
      [key]: Math.max(1, currentQuantity - 1),
    }));
  };

  const selectAllVisible = () => {
    if (addingCards) {
      return;
    }

    setSelectedCards((current) => {
      const next = {
        ...current,
      };

      availableCards.forEach((card) => {
        if (!card.already_owned) {
          next[getCardSelectionKey(card)] = card;
        }
      });

      return next;
    });

    setSelectedQuantities((current) => {
      const next = {
        ...current,
      };

      availableCards.forEach((card) => {
        if (!card.already_owned) {
          const key = getCardSelectionKey(card);

          if (next[key] === undefined) {
            next[key] = 1;
          }
        }
      });

      return next;
    });
  };

  const setAllVisibleToFour = () => {
    if (addingCards) {
      return;
    }

    setSelectedCards((current) => {
      const next = {
        ...current,
      };

      availableCards.forEach((card) => {
        if (!card.already_owned) {
          next[getCardSelectionKey(card)] = card;
        }
      });

      return next;
    });

    setSelectedQuantities((current) => {
      const next = {
        ...current,
      };

      availableCards.forEach((card) => {
        if (!card.already_owned) {
          next[getCardSelectionKey(card)] = MAX_QUANTITY;
        }
      });

      return next;
    });
  };

  const clearSelectedCards = () => {
    if (addingCards) {
      return;
    }

    setSelectedCards({});
    setSelectedQuantities({});
  };

  const handleAddSelected = async () => {
    const selectedList = Object.values(selectedCards);

    if (!selectedList.length) {
      return;
    }

    setAddingCards(true);
    setError("");

    try {
      const data = await requestJson(
        `${API_BASE_URL}/tbotapp/user-cards/create/`,
        {
          method: "POST",
          body: JSON.stringify({
            cards: selectedList.map((card) => {
              const key = getCardSelectionKey(card);

              return {
                card_name: card.card_name,
                quantity: getSelectedQuantity(selectedQuantities[key] ?? 1),
              };
            }),
          }),
        },
      );

      setSelectedCards({});
      setSelectedQuantities({});

      if (onCardsAdded) {
        await onCardsAdded(data?.cards || []);
      }

      closeModal();
    } catch (requestError) {
      if (requestError.data?.already_owned?.length) {
        const names = requestError.data.already_owned
          .map((card) => card.card_name)
          .join(", ");

        setError(`Already in your collection: ${names}`);
      } else {
        setError(requestError.message || "Unable to add cards.");
      }
    } finally {
      setAddingCards(false);
    }
  };

  const selectionEmptyState = (
    <SelectionEmptyState
      selectedSides={selectedSides}
      selectedClasses={selectedClasses}
    />
  );

  const hasSelections = selectedSides.length > 0 && selectedClasses.length > 0;

  const cardCountLabel =
    availableCards.length === 1
      ? `${availableCards.length} card`
      : `${availableCards.length} cards`;

  const allCardsOwned =
    availableCards.length || availableCards.every((card) => card.already_owned);

  const selectAvailableDisabled = loadingCards || addingCards || allCardsOwned;

  const setAllFourDisabled = loadingCards || addingCards || allCardsOwned;

  const clearDisabled = addingCards || selectedCount === 0;

  if (!isOpen) {
    return null;
  }

  return (
    <div ref={backdropRef} className="card-manager-modal-backdrop">
    <dialog
  className="card-manager-modal"
  aria-labelledby="add-cards-title"
  open
>
        <div className="card-manager-modal-header">
          <div>
            <h2 id="add-cards-title">Add Cards</h2>
            <p>
              Select one or more sides and classes, then choose the cards you
              want to add.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={closeModal}
            disabled={addingCards}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && <div className="card-manager-message error">{error}</div>}

        <div className="card-manager-filters">
          <div className="filter-group">
            <label htmlFor="card-side">Side</label>

            <Select
              inputId="card-side"
              styles={selectStyles}
              menuPortalTarget={document.body}
              options={SIDE_OPTIONS}
              value={selectedSides}
              onChange={(value) => {
                setSelectedSides(value || []);
                setSelectedClasses([]);
                setSelectedCards({});
                setSelectedQuantities({});
                setSearch("");
                setError("");
              }}
              isMulti
              closeMenuOnSelect={false}
              isDisabled={addingCards}
              placeholder="Select sides..."
            />
          </div>

          <div className="filter-group">
            <label htmlFor="card-class">Class</label>

            <Select
              inputId="card-class"
              styles={selectStyles}
              menuPortalTarget={document.body}
              options={classes}
              value={selectedClasses}
              onChange={(value) => {
                setSelectedClasses(value || []);
                setSelectedCards({});
                setSelectedQuantities({});
                setError("");
              }}
              isMulti
              closeMenuOnSelect={false}
              isDisabled={
                !selectedSides.length || loadingClasses || addingCards
              }
              isLoading={loadingClasses}
              placeholder={
                selectedSides.length
                  ? "Select classes..."
                  : "Select a side first"
              }
            />
          </div>

          <div className="filter-group search-group">
            <label htmlFor="card-search">Search</label>

            <input
              id="card-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setError("");
              }}
              placeholder={
                selectedClasses.length
                  ? "Search cards..."
                  : "Select a class first"
              }
              disabled={!selectedClasses.length || addingCards}
            />
          </div>
        </div>

        {!hasSelections ? (
          selectionEmptyState
        ) : (
          <>
            <div className="available-cards-toolbar">
              <span>{loadingCards ? "Loading cards..." : cardCountLabel}</span>

              <div className="selection-actions">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  disabled={selectAvailableDisabled}
                >
                  Select Available
                </button>

                <button
                  type="button"
                  onClick={setAllVisibleToFour}
                  disabled={setAllFourDisabled}
                >
                  Set All +4
                </button>

                <button
                  type="button"
                  onClick={clearSelectedCards}
                  disabled={clearDisabled}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="available-card-list">
              <CardListContent
                loadingCards={loadingCards}
                availableCards={availableCards}
                selectedCards={selectedCards}
                selectedQuantities={selectedQuantities}
                addingCards={addingCards}
                onToggle={toggleCardSelection}
                onDecrease={decreaseSelectedQuantity}
                onIncrease={increaseSelectedQuantity}
              />
            </div>
          </>
        )}

        <div className="card-manager-modal-footer">
          <span className="selected-count">{selectedCount} selected</span>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="modal-cancel-button"
              onClick={closeModal}
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
      </dialog>
    </div>
  );
}
