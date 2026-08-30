import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AddDeckModal from "./AddDeckModal";
import EditDeckModal from "./EditDeckModal";
import "../css/deckmodal.css";

const HERO_COLORS = {
  "Beta-Carrotina": ["brown", "gray"],
  Citron: ["brown", "gray"],
  "Captain Combustible": ["red", "green"],
  Chompzilla: ["green", "yellow"],
  "Grass Knuckles": ["green", "brown"],
  "Green Shadow": ["green", "gray"],
  "Night Cap": ["red", "gray"],
  Rose: ["gray", "yellow"],
  "Solar Flare": ["red", "yellow"],
  Spudow: ["red", "brown"],
  "Wall-Knight": ["brown", "yellow"],
  "Brain Freeze": ["black", "blue"],
  "Electric Boogaloo": ["blue", "purple"],
  "Huge-Gigantacus": ["pink", "black"],
  "Super Brainz": ["pink", "black"],
  Immorticia: ["pink", "blue"],
  Impfinity: ["black", "purple"],
  Neptuna: ["orange", "black"],
  "Professor Brainstorm": ["pink", "purple"],
  Rustbolt: ["pink", "orange"],
  "The Smash": ["orange", "blue"],
  "Z-mech": ["orange", "purple"],
};

const normalizeHeroName = (hero) =>
  String(hero || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getHeroColors = (hero) => {
  const normalizedHero = normalizeHeroName(hero);

  const entry = Object.entries(HERO_COLORS).find(
    ([name]) => normalizeHeroName(name) === normalizedHero,
  );

  return entry?.[1] || ["default", "default"];
};

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

const getImageUrl = (value) => {
  const image = String(value || "").trim();

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  if (image.startsWith("/media/")) {
    return `${API_BASE_URL}${image}`;
  }

  if (image.startsWith("/")) {
    return `${API_BASE_URL}${image}`;
  }

  if (image.startsWith("decklists/")) {
    return `${API_BASE_URL}/media/${image}`;
  }

  return `${API_BASE_URL}/${image}`;
};

const hasValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  return String(value).trim() !== "";
};

const normalizeText = (value) => {
  return String(value ?? "").trim();
};

const getOwnerName = (deck) => {
  return (
    normalizeText(deck?.owner) ||
    normalizeText(deck?.owner_username) ||
    normalizeText(deck?.owner_name) ||
    normalizeText(deck?.username) ||
    normalizeText(deck?.profile_display_name) ||
    normalizeText(deck?.display_name) ||
    normalizeText(deck?.profile_slug) ||
    normalizeText(deck?.user) ||
    ""
  );
};

const formatSuggestionCooldown = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).split(".")[0];
  }

  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatCost = (value) => {
  if (!hasValue(value)) {
    return "-";
  }

  const raw = String(value).trim();
  const numericValue = Number(raw.replace(/,/g, ""));

  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString("en-US");
  }

  return raw;
};

const toExternalUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const markdownMatch = /\((https?:\/\/[^)]+)\)/i.exec(raw);
  const inlineUrlMatch = /https?:\/\/\S+/i.exec(raw);

  let candidate = (markdownMatch?.[1] || inlineUrlMatch?.[0] || raw)
    .trim()
    .replace(/\s+/g, "");

  const trimChars = "'\"<>[]";

  while (candidate && trimChars.includes(candidate[0])) {
    candidate = candidate.slice(1);
  }

  while (candidate && trimChars.includes(candidate.at(-1))) {
    candidate = candidate.slice(0, -1);
  }

  if (!candidate) {
    return "";
  }

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    return new URL(candidate).toString();
  } catch {
    return "";
  }
};

const parseCardRatioLines = (value) =>
  String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, countPart] = line.split("|");
      const name = String(namePart || "").trim();
      const parsedCount = Number(countPart);

      const count =
        Number.isFinite(parsedCount) && parsedCount > 0
          ? Math.min(parsedCount, 4)
          : 1;

      return {
        name,
        count,
      };
    })
    .filter((entry) => entry.name);

const formatCardsDisplay = (value) => {
  const entries = parseCardRatioLines(value);

  if (entries.length === 0) {
    return "";
  }

  return entries.map((entry) => `${entry.name} x${entry.count}`).join(", ");
};

function DeckCard({
  decklist,
  admin = false,
  adminMode = false,
  addMode = false,
  onDelete,
  onSave,
  onAdd,
  onComplete,
  editSaving = false,
  allCards = [],
  profileSlug = "",
  profileIsPublic = null,
  autoOpen = false,
  legacy = false,
  decklists = false,
  deckbuilder = false,
  showSuggestDeck = false,
}) {
  const deck = decklist ?? {};

  const isAdmin = admin || adminMode;

  const [heroColor1, heroColor2] = getHeroColors(deck.hero);

  const deckId = deck.deckid ?? deck.deckID ?? deck.deckId ?? deck.id ?? "";

  const deckKey = String(deckId || deck.name || "");

  const deckName = String(deck.name || "deck")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const shareDeckKey = deckName ? `${deckName}-${deckKey}` : deckKey;
  const isDeckUrlMatch = (urlDeck) => {
    if (!urlDeck) {
      return false;
    }

    const value = String(urlDeck).trim();

    return value === deckKey || value === shareDeckKey;
  };
  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(addMode || autoOpen);
  const [editing, setEditing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImgError, setEditImgError] = useState(false);
  const [editSavingLocal, setEditSavingLocal] = useState(false);

  const editModalRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestStatus, setSuggestStatus] = useState(null);
  const [suggestMessage, setSuggestMessage] = useState("");
  const [suggestCooldown, setSuggestCooldown] = useState(null);
  const [suggestionId, setSuggestionId] = useState(null);

  const deckImage = getImageUrl(deck.image);

  const description = hasValue(deck.description)
    ? deck.description
    : "No description available.";

  const ownerName = getOwnerName(deck);

  useEffect(() => {
    if (!showSuggestDeck) {
      setCheckingLogin(false);
      setIsLoggedIn(false);
      return;
    }

    let cancelled = false;

    const checkLogin = async () => {
      setCheckingLogin(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/auth/discord/me/`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setIsLoggedIn(false);
          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const loggedIn =
          data?.authenticated === true ||
          data?.is_authenticated === true ||
          data?.logged_in === true ||
          data?.loggedIn === true ||
          Boolean(data?.discord_id);

        setIsLoggedIn(loggedIn);
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to check Discord login status:", error);

          setIsLoggedIn(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingLogin(false);
        }
      }
    };

    checkLogin();

    return () => {
      cancelled = true;
    };
  }, [showSuggestDeck]);

  useEffect(() => {
    if (addMode || autoOpen) {
      setOpen(true);
      return;
    }

    if (!deckKey) {
      return;
    }

    if (isDeckUrlMatch(searchParams.get("deck"))) {
      setOpen(true);
    }
  }, [searchParams, deckKey, shareDeckKey, addMode, autoOpen]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !editSavingLocal && !editSaving) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, editSavingLocal, editSaving]);

  useEffect(() => {
    if (!editing) {
      return;
    }

    setEditImgError(false);

    if (!editImageFile) {
      setEditImagePreview(deck.image ?? "");
    }
  }, [editing, deck.image, editImageFile]);

  const openModal = () => {
    if (addMode) {
      setOpen(true);
      return;
    }

    setOpen(true);
    setEditing(false);

    if (autoOpen) {
      return;
    }

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("deck", deckKey);
    setSearchParams(next);
  };

  const closeModal = () => {
    if (editSavingLocal || editSaving) {
      return;
    }

    if (addMode) {
      setOpen(false);

      if (typeof onComplete === "function") {
        onComplete(null);
      }

      return;
    }

    setOpen(false);
    setEditing(false);
    setEditImageFile(null);
    setEditImagePreview("");
    setEditImgError(false);

    if (autoOpen) {
      return;
    }

    if (!deckKey) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (next.get("deck") === deckKey) {
      next.delete("deck");
      setSearchParams(next);
    }
  };

  const resetEditImageState = () => {
    setEditImageFile(null);
    setEditImagePreview(deck.image ?? "");
    setEditImgError(false);
  };

  const isSaving = editSavingLocal || editSaving;

  const startEditing = () => {
    if (!isAdmin || isSaving) {
      return;
    }

    setEditImageFile(null);
    setEditImagePreview(deck.image ?? "");
    setEditImgError(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (editSavingLocal || editSaving) {
      return;
    }

    resetEditImageState();
    setEditing(false);
  };

  const handleEditImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setEditImgError(false);

    if (!file) {
      setEditImageFile(null);
      setEditImagePreview(deck.image ?? "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      setEditImageFile(null);
      setEditImagePreview(deck.image ?? "");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setEditImageFile(file);
    setEditImagePreview(previewUrl);
  };

  const handleEditSave = async () => {
    if (!editModalRef.current?.save) {
      console.error("EditDeckModal save method is unavailable.");
      return;
    }

    try {
      await editModalRef.current.save();
    } catch (error) {
      console.error("Unable to save deck:", error);
    }
  };

  const handleDelete = () => {
    if (typeof onDelete === "function") {
      onDelete(deck);
    }
  };

  const handleSuggestDeck = async () => {
    if (!showSuggestDeck) {
      return;
    }

    if (suggesting) {
      return;
    }

    if (!isLoggedIn) {
      setSuggestStatus("login");
      setSuggestMessage(
        "You must be logged in with Discord to suggest a deck.",
      );
      return;
    }

    if (!deckId) {
      setSuggestStatus("error");
      setSuggestMessage("This deck does not have a valid deck ID.");
      return;
    }

    if (
      suggestStatus === "success" ||
      suggestStatus === "confirmed" ||
      suggestStatus === "awaiting_creator" ||
      suggestStatus === "already_suggested" ||
      suggestStatus === "cooldown"
    ) {
      return;
    }

    setSuggesting(true);
    setSuggestStatus(null);
    setSuggestMessage("");
    setSuggestCooldown(null);
    setSuggestionId(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/tbotapp/user-deck-suggestions/create/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            deck_id: deckId,
          }),
        },
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (
        response.status === 201 &&
        (data?.consent_status === "confirmed" ||
          data?.status === "confirmed" ||
          data?.status === "success")
      ) {
        setSuggestionId(data?.suggestion_id || null);

        setSuggestStatus("success");

        setSuggestMessage(
          data?.message || "Your deck suggestion was submitted successfully!",
        );

        return;
      }

      if (
        response.status === 202 ||
        data?.status === "awaiting_creator" ||
        data?.status === "pending_creator" ||
        data?.consent_status === "awaiting_creator"
      ) {
        setSuggestionId(data?.suggestion_id || null);

        setSuggestStatus("awaiting_creator");

        setSuggestMessage(
          data?.message ||
            data?.detail ||
            "The deck creator must approve this suggestion in Discord before it can be confirmed.",
        );

        return;
      }

      if (response.status === 401) {
        setIsLoggedIn(false);
        setSuggestStatus("login");

        setSuggestMessage(
          data?.message ||
            data?.detail ||
            "You must be logged in with Discord to suggest a deck.",
        );

        return;
      }

      if (
        response.status === 409 ||
        data?.status === "already_suggested" ||
        data?.reason === "already_suggested"
      ) {
        setSuggestStatus("already_suggested");

        setSuggestMessage(
          data?.message ||
            data?.detail ||
            "You have already suggested this deck.",
        );

        return;
      }

      if (
        response.status === 429 ||
        data?.status === "cooldown" ||
        data?.reason === "cooldown"
      ) {
        setSuggestStatus("cooldown");

        setSuggestMessage(
          data?.message ||
            data?.detail ||
            "You are currently on cooldown before you can suggest another deck.",
        );

        setSuggestCooldown(
          data?.next_available ||
            data?.available_at ||
            data?.cooldown_until ||
            data?.nextSuggestionAt ||
            null,
        );

        return;
      }

      if (
        data?.status === "denied" ||
        data?.reason === "denied" ||
        data?.consent_status === "denied"
      ) {
        setSuggestStatus("denied");

        setSuggestMessage(
          data?.message ||
            data?.detail ||
            "The deck creator did not approve this suggestion.",
        );

        return;
      }

      setSuggestStatus("error");

      setSuggestMessage(
        data?.message ||
          data?.detail ||
          "Unable to submit the deck suggestion. Please try again.",
      );
    } catch (error) {
      console.error("Unable to suggest deck:", error);

      setSuggestStatus("error");

      setSuggestMessage("Unable to connect to the server. Please try again.");
    } finally {
      setSuggesting(false);
    }
  };
  useEffect(() => {
    if (
      !showSuggestDeck ||
      !isLoggedIn ||
      !suggestionId ||
      suggestStatus !== "awaiting_creator"
    ) {
      return;
    }

    let cancelled = false;

    const checkSuggestionStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/user-deck-suggestions/${encodeURIComponent(
            suggestionId,
          )}/status/`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          setIsLoggedIn(false);
          return;
        }

        if (response.status === 404) {
          console.warn(
            `Suggestion ${suggestionId} was not found when checking status.`,
          );
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (data?.suggestion_id) {
          setSuggestionId(data.suggestion_id);
        }

        if (
          data?.consent_status === "confirmed" ||
          data?.status === "confirmed"
        ) {
          setSuggestStatus("success");
          setSuggestMessage(
            "Your deck suggestion was approved by the creator and has been confirmed!",
          );
          return;
        }

        if (data?.consent_status === "denied" || data?.status === "denied") {
          setSuggestStatus("denied");
          setSuggestMessage(
            "The deck creator did not approve this suggestion.",
          );
          return;
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to check deck suggestion status:", error);
        }
      }
    };

    checkSuggestionStatus();

    const interval = window.setInterval(checkSuggestionStatus, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [showSuggestDeck, isLoggedIn, suggestionId, suggestStatus]);

  const handleShare = async () => {
    if (isAdmin) {
      return;
    }

    if (!deckKey) {
      return;
    }

    let shareUrl;
    if (deckbuilder || decklists || legacy) {
      shareUrl = new URL(window.location.pathname, window.location.origin);

      shareUrl.searchParams.set("deck", shareDeckKey);
    } else {
      const resolvedProfileSlug = String(
        profileSlug || deck.profile_slug || deck.profileSlug || "",
      ).trim();

      const resolvedProfileIsPublic =
        profileIsPublic !== null && profileIsPublic !== undefined
          ? profileIsPublic === true
          : deck.is_public === true ||
            deck.profile_is_public === true ||
            deck.profileIsPublic === true;

      if (resolvedProfileIsPublic && resolvedProfileSlug) {
        shareUrl = new URL(
          `/profile/${encodeURIComponent(resolvedProfileSlug)}`,
          window.location.origin,
        );

        shareUrl.searchParams.set("deck", shareDeckKey);
      } else if (resolvedProfileSlug) {
        shareUrl = new URL(
          `/deck/${encodeURIComponent(
            resolvedProfileSlug,
          )}/${encodeURIComponent(shareDeckKey)}`,
          window.location.origin,
        );
      } else {
        console.error(
          "Unable to create deck share link: profile slug is missing.",
        );
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl.toString());

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  /*
   * ------------------------------------------------------------
   * DOWNLOAD
   * ------------------------------------------------------------
   */

  const handleDownload = async () => {
    const imageUrl = getImageUrl(deck.image);

    if (!imageUrl) {
      return;
    }

    try {
      const response = await fetch(imageUrl, {
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("Image fetch failed");
      }

      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;

      link.download = `${deck.name || "decklist"}.png`.replace(/\s+/g, "_");

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Direct download blocked, opening image instead", error);

      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  };

  /*
   * ------------------------------------------------------------
   * COMPLETION
   * ------------------------------------------------------------
   */

  const handleAddComplete = (result) => {
    setOpen(false);

    if (typeof onComplete === "function") {
      onComplete(result);
    }
  };

  const handleEditComplete = (result) => {
    if (!result) {
      return;
    }

    resetEditImageState();
    setEditing(false);
  };

  /*
   * ------------------------------------------------------------
   * ADD MODE
   * ------------------------------------------------------------
   */

  if (addMode) {
    if (!open) {
      return null;
    }

    return (
      <AddDeckModal
        open={open}
        allCards={allCards}
        onAdd={onAdd}
        onClose={closeModal}
        onComplete={handleAddComplete}
      />
    );
  }

  const editImage = getImageUrl(editImagePreview);

  /*
   * ------------------------------------------------------------
   * CARD
   * ------------------------------------------------------------
   */

  return (
    <>
      <div className={`deck-listing-card hero-${heroColor1}-${heroColor2}`}>
        <div
          className="deck-card-image-only"
          onClick={openModal}
          style={{
            cursor: "pointer",
          }}
        >
          {deckImage && !imgError ? (
            <img
              src={deckImage}
              alt={deck.name || "Deck image"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="deck-image-placeholder">No image</div>
          )}

          <button
            type="button"
            className="view-details-btn"
            onClick={(event) => {
              event.stopPropagation();
              openModal();
            }}
            aria-label={`View details for ${deck.name || "deck"}`}
          >
            View Details
          </button>
        </div>

        <div className="deck-listing-info">
          <h3>{deck.name || "Untitled Deck"}</h3>

          <p>
            <span>Hero:</span> {deck.hero || "-"}
          </p>

          <p>
            <span>Category:</span> {deck.category || "-"}
          </p>

          <p>
            <span>Archetype:</span> {deck.archetype || "-"}
          </p>

          <p>
            <span>Cost:</span> {formatCost(deck.cost)}
            <img
              src="https://i.ibb.co/jZkdqf6y/spark.webp"
              alt="Spark icon"
              className="spark-icon"
            />
          </p>

          {hasValue(deck.creator) && (
            <p>
              <span>Creator:</span> {deck.creator}
            </p>
          )}

          {hasValue(deck.optimization) && (
            <p>
              <span>Optimized by:</span> {deck.optimization}
            </p>
          )}

          {isAdmin && hasValue(ownerName) && (
            <p>
              <span>Owner:</span> {ownerName}
            </p>
          )}
        </div>
      </div>

      {open && (
        <div className="modal-overlay">
          <dialog
            open
            className="modal"
            aria-label={
              editing
                ? `Edit ${deck.name || "deck"}`
                : `Details for ${deck.name || "deck"}`
            }
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              aria-label="Close details"
              disabled={isSaving}
            >
              ×
            </button>

            <div className="modal-scroll-content">
              <div className="modal-content">
                <div className="modal-image">
                  {editing ? (
                    <>
                      {editImage && !editImgError ? (
                        <img
                          src={editImage}
                          alt={deck.name || "Deck image"}
                          onError={() => setEditImgError(true)}
                        />
                      ) : (
                        <div className="deck-image-placeholder">No image</div>
                      )}

                      <label className="admin-modal-field">
                        <span>Upload Image</span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleEditImageFileChange}
                          disabled={isSaving}
                        />
                      </label>
                    </>
                  ) : deckImage && !imgError ? (
                    <img
                      src={deckImage}
                      alt={deck.name || "Deck image"}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="deck-image-placeholder">No image</div>
                  )}

                  {!editing &&
                    (hasValue(deck.creator) ||
                      hasValue(deck.optimization) ||
                      hasValue(deck.inspiration) ||
                      hasValue(deck.suggested_date) ||
                      hasValue(deck.updated_date)) && (
                      <div className="image-meta">
                        {(hasValue(deck.creator) ||
                          hasValue(deck.optimization) ||
                          hasValue(deck.inspiration)) && (
                          <p>
                            {hasValue(deck.creator) && (
                              <>
                                Created by <span>{deck.creator}</span>
                              </>
                            )}

                            {hasValue(deck.optimization) && (
                              <>
                                {hasValue(deck.creator) ? ", " : ""}
                                Optimized by <span>{deck.optimization}</span>
                              </>
                            )}

                            {hasValue(deck.inspiration) && (
                              <>
                                {hasValue(deck.creator) ||
                                hasValue(deck.optimization)
                                  ? ", "
                                  : ""}
                                Inspired by <span>{deck.inspiration}</span>
                              </>
                            )}
                          </p>
                        )}

                        {hasValue(deck.suggested_date) && (
                          <p>Suggested on {deck.suggested_date}</p>
                        )}

                        {hasValue(deck.updated_date) && (
                          <p>Updated on {deck.updated_date}</p>
                        )}
                      </div>
                    )}

                  {!editing && (
                    <div className="modal-actions">
                      {!isAdmin && (
                        <>
                          <button
                            type="button"
                            className="share-btn"
                            onClick={handleShare}
                          >
                            {copied ? "Link Copied!" : "Share Deck"}
                          </button>

                          {showSuggestDeck && !checkingLogin && (
                            <button
                              type="button"
                              className={`suggest-deck-btn ${
                                suggesting ? "suggesting" : ""
                              } ${
                                suggestStatus ? `suggest-${suggestStatus}` : ""
                              }`}
                              onClick={handleSuggestDeck}
                              disabled={
                                suggesting ||
                                suggestStatus === "success" ||
                                suggestStatus === "confirmed" ||
                                suggestStatus === "awaiting_creator" ||
                                suggestStatus === "already_suggested" ||
                                suggestStatus === "cooldown"
                              }
                            >
                              {suggesting
                                ? "Submitting..."
                                : suggestStatus === "success" ||
                                    suggestStatus === "confirmed"
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

                      {hasValue(deck.image) && (
                        <button
                          type="button"
                          className="download-btn"
                          onClick={handleDownload}
                        >
                          Download Decklist
                        </button>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="admin-modal-actions">
                      {!editing ? (
                        <>
                          <button
                            type="button"
                            className="admin-modal-edit"
                            onClick={startEditing}
                            disabled={isSaving}
                          >
                            Edit Deck
                          </button>

                          <button
                            type="button"
                            className="admin-modal-delete"
                            onClick={handleDelete}
                            disabled={isSaving}
                          >
                            Delete Deck
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="admin-modal-edit"
                            onClick={cancelEditing}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="admin-modal-save"
                            onClick={handleEditSave}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-info">
                  {editing ? (
                    <EditDeckModal
                      ref={editModalRef}
                      deck={deck}
                      allCards={allCards}
                      onSave={onSave}
                      onComplete={handleEditComplete}
                      imageFile={editImageFile}
                      imageUrl={editImagePreview}
                      onSavingChange={setEditSavingLocal}
                    />
                  ) : (
                    <>
                      <div className="modal-header">
                        <div className="modal-title-content">
                          <h2 className="modal-title">
                            {deck.name || "Untitled Deck"}
                          </h2>

                          <span className="deck-hero">
                            {deck.hero || "Unknown Hero"}
                          </span>
                        </div>
                      </div>
                      <section className="modal-section description-section">
                        <h3>Description</h3>

                        <p className="description">{description}</p>
                      </section>
                      <section className="modal-metadata">
                        {hasValue(toExternalUrl(deck.deck_doc)) && (
                          <div className="metadata-item">
                            <span className="label">Deck Tutorial</span>

                            <a
                              href={toExternalUrl(deck.deck_doc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="deck-doc-link"
                            >
                              Open tutorial
                            </a>
                          </div>
                        )}

                        <div className="metadata-item">
                          <span className="label">Category</span>

                          <span className="value">{deck.category || "-"}</span>
                        </div>

                        <div className="metadata-item">
                          <span className="label">Archetype</span>

                          <span className="value">{deck.archetype || "-"}</span>
                        </div>

                        <div className="metadata-item cost-item">
                          <span className="label">Cost</span>

                          <span className="cost-value">
                            {formatCost(deck.cost)}

                            <img
                              src="https://i.ibb.co/jZkdqf6y/spark.webp"
                              alt="Spark icon"
                              className="spark-icon"
                            />
                          </span>
                        </div>

                        {isAdmin && hasValue(ownerName) && (
                          <div className="metadata-item">
                            <span className="label">Owner</span>

                            <span className="value">{ownerName}</span>
                          </div>
                        )}
                      </section>
                      {isAdmin && (
                        <section className="modal-section admin-cards-section">
                          <h3>Cards</h3>

                          <div className="admin-cards-value">
                            {hasValue(deck.cards)
                              ? formatCardsDisplay(deck.cards) || deck.cards
                              : "No cards listed."}
                          </div>
                        </section>
                      )}

                      {showSuggestDeck && !isAdmin && suggestStatus && (
                        <div
                          className={`suggest-deck-message suggest-message-${suggestStatus}`}
                          role="status"
                        >
                          {/*
                           * CONFIRMED
                           */}

                          {(suggestStatus === "success" ||
                            suggestStatus === "confirmed") && (
                            <>
                              <strong>Thanks for suggesting this deck!</strong>

                              <p>
                                Your suggestion has been approved by the creator
                                and confirmed successfully.
                              </p>

                              <p>
                                If you want to help defend and discuss the deck,
                                join the Discord community and let everyone know
                                why you think this deck deserves attention.
                                <br />
                                <a
                                  href="https://discord.gg/PdZb2hGt7G"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Discord link
                                </a>
                              </p>
                            </>
                          )}

                          {/*
                           * AWAITING CREATOR APPROVAL
                           */}

                          {suggestStatus === "awaiting_creator" && (
                            <>
                              <strong>Awaiting creator approval.</strong>

                              <p>
                                The deck creator has been sent a Discord request
                                to approve this suggestion.
                              </p>

                              <p>
                                The suggestion will only be confirmed if the
                                creator approves it.
                              </p>

                              <p>
                                You can join the Discord community while you
                                wait.
                                <br />
                                <a
                                  href="https://discord.gg/PdZb2hGt7G"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Discord link
                                </a>
                              </p>

                              {suggestionId && (
                                <p>
                                  <small>Waiting for creator consent...</small>
                                </p>
                              )}
                            </>
                          )}

                          {/*
                           * ALREADY SUGGESTED
                           */}

                          {suggestStatus === "already_suggested" && (
                            <>
                              <strong>This deck was already suggested.</strong>

                              <p>
                                This deck has already been suggested. Join the
                                Discord server below to find the suggestion.
                                <br />
                                <a
                                  href="https://discord.gg/PdZb2hGt7G"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Discord link
                                </a>
                              </p>
                            </>
                          )}

                          {/*
                           * COOLDOWN
                           */}

                          {suggestStatus === "cooldown" && (
                            <>
                              <strong>You are on suggestion cooldown.</strong>

                              <p>{suggestMessage}</p>

                              {suggestCooldown && (
                                <p>
                                  Next available:{" "}
                                  {formatSuggestionCooldown(suggestCooldown)}
                                </p>
                              )}

                              <p>
                                In the meantime, consider joining the Discord
                                and helping defend or discuss decks that have
                                already been suggested.
                                <br />
                                <a
                                  href="https://discord.gg/PdZb2hGt7G"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Discord link
                                </a>
                              </p>
                            </>
                          )}

                          {/*
                           * CREATOR DENIED
                           */}

                          {suggestStatus === "denied" && (
                            <>
                              <strong>Suggestion not approved.</strong>

                              <p>
                                {suggestMessage ||
                                  "The deck creator did not approve this suggestion."}
                              </p>
                            </>
                          )}

                          {suggestStatus === "login" && (
                            <>
                              <strong>Discord login required.</strong>
                              <p>
                                You must log in with Discord before you can
                                suggest a deck.
                              </p>
                            </>
                          )}

                          {suggestStatus === "error" && (
                            <>
                              <strong>Suggestion failed.</strong>

                              <p>{suggestMessage}</p>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
}

export default DeckCard;
