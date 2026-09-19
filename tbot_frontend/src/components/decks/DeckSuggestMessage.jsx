import { formatSuggestionCooldown } from "../../utils/deckCardHelpers";

function DeckSuggestMessage({
  show,
  suggestStatus,
  suggestMessage,
  suggestCooldown,
  suggestionId,
}) {
  if (!show || !suggestStatus) {
    return null;
  }

  return (
    <div
      className={`suggest-deck-message suggest-message-${suggestStatus}`}
      role="status"
    >
      {(suggestStatus === "success" || suggestStatus === "confirmed") && (
        <>
          <strong>Thanks for suggesting this deck!</strong>

          <p>
            Your suggestion has been approved by the creator and confirmed
            successfully.
          </p>

          <p>
            If you want to help defend and discuss the deck, join the
            Discord community and let everyone know why you think this deck
            deserves attention.
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

      {suggestStatus === "awaiting_creator" && (
        <>
          <strong>Awaiting creator approval.</strong>

          <p>
            The deck creator has been sent a Discord request to approve this
            suggestion.
          </p>

          <p>
            The suggestion will only be confirmed if the creator approves
            it.
          </p>

          <p>
            You can join the Discord community while you wait.
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

      {suggestStatus === "already_suggested" && (
        <>
          <strong>This deck was already suggested.</strong>

          <p>
            This deck has already been suggested. Join the Discord server
            below to find the suggestion.
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

      {suggestStatus === "cooldown" && (
        <>
          <strong>You are on suggestion cooldown.</strong>

          <p>{suggestMessage}</p>

          {suggestCooldown && (
            <p>
              Next available: {formatSuggestionCooldown(suggestCooldown)}
            </p>
          )}

          <p>
            In the meantime, consider joining the Discord and helping
            defend or discuss decks that have already been suggested.
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

          <p>You must log in with Discord before you can suggest a deck.</p>
        </>
      )}

      {suggestStatus === "error" && (
        <>
          <strong>Suggestion failed.</strong>

          <p>{suggestMessage}</p>
        </>
      )}
    </div>
  );
}

export default DeckSuggestMessage;