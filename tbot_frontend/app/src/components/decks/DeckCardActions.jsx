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
}) {
  return (
    <div className="modal-actions">
      {!isAdmin && (
        <>
          <button type="button" className="share-btn" onClick={onShare}>
            {copied ? "Link Copied!" : "Share Deck"}
          </button>

          {showSuggestDeck && !checkingLogin && (
            <button
              type="button"
              className={`suggest-deck-btn ${
                suggesting ? "suggesting" : ""
              } ${suggestStatus ? `suggest-${suggestStatus}` : ""}`}
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

      {deckHasImage && (
        <button type="button" className="download-btn" onClick={onDownload}>
          Download Decklist
        </button>
      )}
    </div>
  );
}

export default DeckCardActions;