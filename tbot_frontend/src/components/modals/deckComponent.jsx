import { useEffect, useRef, useState } from "react";

import { useSearchParams } from "react-router-dom";

import { API_BASE_URL } from "../../utils/api";

import {
  getHeroColors,
  getImageUrl,
  hasValue,
  getOwnerName,
  normalizeDeckShareValue,
  getDeckCardShareUrl,
  downloadDeckCard,
} from "../../utils/deckCardHelpers";

import { useDiscordLoginStatus } from "../../hooks/useDiscordLoginStatus";

import { useDeckSuggestion } from "../../hooks/useDeckSuggestion";

import AddDeckModal from "../modals/addDeckModal";

import DeckCardPreview from "../decks/deckCardPreview";

import DeckCardModal from "../decks/deckCardModal";

import "../../css/modals/deckModal.css";

import { removeSavedDeck, saveDeck } from "../../utils/savedDecks";

function DeckCard({
  decklist,
  admin = false,
  adminMode = false,
  addMode = false,
  adminForm = false,
  onDelete,
  onSave,
  onAdd,
  onComplete,
  onRemoveSaved,
  editSaving = false,
  allCards = [],
  profileSlug = "",
  profileIsPublic = null,
  autoOpen = false,
  legacy = false,
  decklists = false,
  deckbuilder = false,
  showSuggestDeck = false,
  isUserDeck = false,
  isSavedDeck = false,
  savedDeckTab = false,
  hideShare = false,
}) {
  const deck = decklist ?? {};

  const isAdmin = admin || adminMode;

  const [heroColor1, heroColor2] = getHeroColors(deck.hero);

  const sourceDeckId =
    deck.source_deck_id ??
    deck.sourceDeckId ??
    (isUserDeck
      ? (deck.id ?? deck.deckid ?? deck.deckID ?? deck.deckId)
      : (deck.deckid ?? deck.deckID ?? deck.deckId)) ??
    "";

  const deckId = sourceDeckId;

  const sourceType = String(
    deck.source_type ??
      deck.sourceType ??
      (isUserDeck ? "user_deck" : legacy ? "legacy" : "decklist"),
  )
    .trim()
    .toLowerCase();

  const deckKey = String(deckId || deck.name || "").trim();

  const deckName = String(deck.name || "deck")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const shareDeckKey = deckName ? `${deckName}-${deckKey}` : deckKey;

  const isDeckUrlMatch = (urlDeck) => {
    const normalizedUrlDeck = normalizeDeckShareValue(urlDeck);

    if (!normalizedUrlDeck) {
      return false;
    }

    const normalizedDeckKey = normalizeDeckShareValue(deckKey);

    const normalizedShareDeckKey = normalizeDeckShareValue(shareDeckKey);

    return (
      normalizedUrlDeck === normalizedDeckKey ||
      normalizedUrlDeck === normalizedShareDeckKey
    );
  };

  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(addMode);

  const [editing, setEditing] = useState(false);

  const [imgError, setImgError] = useState(false);

  const [copied, setCopied] = useState(false);

  const [editImageFile, setEditImageFile] = useState(null);

  const [editImagePreview, setEditImagePreview] = useState("");

  const [editImgError, setEditImgError] = useState(false);

  const [editSavingLocal, setEditSavingLocal] = useState(false);

  const [savingDeck, setSavingDeck] = useState(false);

  const [deckSaved, setDeckSaved] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");

  const editModalRef = useRef(null);

  const { isLoggedIn, setIsLoggedIn, checkingLogin } = useDiscordLoginStatus();

  const {
    suggesting,
    suggestStatus,
    suggestMessage,
    suggestCooldown,
    suggestionId,
    handleSuggestDeck,
  } = useDeckSuggestion({
    showSuggestDeck,
    deckId,
    isLoggedIn,
    setIsLoggedIn,
  });

  const getCacheBustedImageUrl = (image, updatedDate) => {
    const imageUrl = getImageUrl(image);

    if (!imageUrl) {
      return imageUrl;
    }

    if (imageUrl.startsWith("blob:")) {
      return imageUrl;
    }

    if (!updatedDate) {
      return imageUrl;
    }

    try {
      const url = new URL(imageUrl, window.location.origin);

      url.searchParams.set("v", updatedDate);

      return url.toString();
    } catch {
      return imageUrl;
    }
  };

  const deckImage = getCacheBustedImageUrl(deck.image, deck.updated_date);

  const description = hasValue(deck.description)
    ? deck.description
    : "No description available.";

  const ownerName = getOwnerName(deck);

  useEffect(() => {
    if (addMode) {
      setOpen(true);
      return;
    }

    if (!deckKey) {
      setOpen(false);
      setEditing(false);
      return;
    }

    const urlDeck = searchParams.get("deck");

    if (isDeckUrlMatch(urlDeck)) {
      setOpen(true);
      setEditing(false);
      return;
    }

    if (!autoOpen) {
      setOpen(false);
      setEditing(false);
    }
  }, [searchParams, deckKey, shareDeckKey, addMode, autoOpen]);

  useEffect(() => {
    setImgError(false);
  }, [deck.image]);

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

    next.set("deck", shareDeckKey);

    if (savedDeckTab) {
      next.set("tab", "saved");
    } else {
      next.delete("tab");
    }

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

    const currentDeck = searchParams.get("deck");

    if (currentDeck && isDeckUrlMatch(currentDeck)) {
      const next = new URLSearchParams(searchParams);

      next.delete("deck");

      if (savedDeckTab) {
        next.delete("tab");
      }

      setSearchParams(next);
    }
  };

  const handleSaveDeck = async () => {
    if (isSavedDeck) {
      return;
    }

    if (checkingLogin) {
      return;
    }

    if (!isLoggedIn) {
      setSaveMessage("Please log in with Discord to save decks.");
      return;
    }

    if (!deckId || savingDeck || deckSaved) {
      return;
    }

    setSavingDeck(true);
    setSaveMessage("");

    try {
      const result = await saveDeck(sourceType, deckId);

      setDeckSaved(true);

      setSaveMessage(
        result.message || `${deck.name || "Deck"} was saved to your profile.`,
      );
    } catch (error) {
      console.error("Unable to save deck:", error);

      setSaveMessage(error.message || "Unable to save deck.");
    } finally {
      setSavingDeck(false);
    }
  };

  const handleRemoveSavedDeck = async () => {
    if (!isSavedDeck) {
      return;
    }

    if (checkingLogin) {
      return;
    }

    if (!isLoggedIn) {
      setSaveMessage("Please log in with Discord to remove saved decks.");
      return;
    }

    if (!deckId || savingDeck) {
      return;
    }

    setSavingDeck(true);
    setSaveMessage("");

    try {
      await removeSavedDeck(sourceType, deckId);

      setSaveMessage(
        `${deck.name || "Deck"} was removed from your saved decks.`,
      );

      if (typeof onRemoveSaved === "function") {
        onRemoveSaved(deck);
      }
    } catch (error) {
      console.error("Unable to remove saved deck:", error);

      setSaveMessage(error.message || "Unable to remove saved deck.");
    } finally {
      setSavingDeck(false);
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

  const handleShare = async () => {
    if (isAdmin || !deckKey) {
      return;
    }

    const shareUrl = getDeckCardShareUrl({
      deck,
      deckKey,
      shareDeckKey,
      sourceDeckId,
      sourceType,
      profileSlug,
      profileIsPublic,
      isSavedDeck,
      isUserDeck,
      legacy,
      decklists,
      deckbuilder,
    });

    if (!shareUrl) {
      return;
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

  const handleDownload = () => {
    console.log("Download clicked", {
      deck,
      isSavedDeck,
      isUserDeck,
      legacy,
    });

    downloadDeckCard({
      deck,
      isSavedDeck,
      isUserDeck,
      legacy,
      apiBaseUrl: API_BASE_URL,
    });
  };

  const handleAddComplete = (result) => {
    if (typeof onComplete === "function") {
      onComplete(result);
    }

    if (result) {
      setOpen(false);
    }
  };

  const handleEditComplete = (result) => {
    if (!result) {
      return;
    }

    resetEditImageState();
    setEditing(false);
  };

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
        isAdmin={adminForm}
      />
    );
  }

  const editImage = getCacheBustedImageUrl(editImagePreview, deck.updated_date);

  const dateLabel =
    decklists || deckbuilder || legacy || admin ? "Suggested on" : "Added on";

  return (
    <>
      <DeckCardPreview
        deck={deck}
        deckImage={deckImage}
        imgError={imgError}
        setImgError={setImgError}
        heroColor1={heroColor1}
        heroColor2={heroColor2}
        isSavedDeck={isSavedDeck}
        isAdmin={isAdmin}
        ownerName={ownerName}
        onOpen={openModal}
      />

      <DeckCardModal
        open={open}
        editing={editing}
        deck={deck}
        allCards={allCards}
        editModalRef={editModalRef}
        deckImage={deckImage}
        editImage={editImage}
        imgError={imgError}
        setImgError={setImgError}
        editImgError={editImgError}
        setEditImgError={setEditImgError}
        editImageFile={editImageFile}
        editImagePreview={editImagePreview}
        handleEditImageFileChange={handleEditImageFileChange}
        isSaving={isSaving}
        isAdmin={isAdmin}
        copied={copied}
        handleShare={handleShare}
        showSuggestDeck={showSuggestDeck}
        checkingLogin={checkingLogin}
        suggesting={suggesting}
        suggestStatus={suggestStatus}
        handleSuggestDeck={handleSuggestDeck}
        deckHasImage={hasValue(deck.image)}
        handleDownload={handleDownload}
        hideShare={hideShare}
        isSavedDeck={isSavedDeck}
        handleRemoveSavedDeck={handleRemoveSavedDeck}
        handleSaveDeck={handleSaveDeck}
        savingDeck={savingDeck}
        deckSaved={deckSaved}
        saveMessage={saveMessage}
        startEditing={startEditing}
        handleDelete={handleDelete}
        cancelEditing={cancelEditing}
        handleEditSave={handleEditSave}
        suggestMessage={suggestMessage}
        suggestCooldown={suggestCooldown}
        suggestionId={suggestionId}
        description={description}
        ownerName={ownerName}
        dateLabel={dateLabel}
        onSave={onSave}
        handleEditComplete={handleEditComplete}
        setEditSavingLocal={setEditSavingLocal}
        closeModal={closeModal}
      />
    </>
  );
}

export default DeckCard;
