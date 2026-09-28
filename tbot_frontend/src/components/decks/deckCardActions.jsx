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
  hideShare = false,
  onSaveDeck,
  savingDeck = false,
  deckSaved = false,
  isSavedDeck = false,
}) {
  return (
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
              className={`suggest-deck-btn ${suggesting ? "suggesting" : ""} ${
                suggestStatus ? `suggest-${suggestStatus}` : ""
              }`}
              onClick={onSuggestDeck}
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
                : suggestStatus === "success" || suggestStatus === "confirmed"
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
          className={`save-deck-btn ${
            deckSaved && !isSavedDeck ? "saved" : ""
          }`}
          onClick={onSaveDeck}
          disabled={checkingLogin || savingDeck || (deckSaved && !isSavedDeck)}
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
  );
}

export default DeckCardActions;
