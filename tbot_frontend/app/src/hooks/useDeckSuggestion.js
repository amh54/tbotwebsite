import { useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/api";

export function useDeckSuggestion({
  showSuggestDeck,
  deckId,
  isLoggedIn,
  setIsLoggedIn,
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestStatus, setSuggestStatus] = useState(null);
  const [suggestMessage, setSuggestMessage] = useState("");
  const [suggestCooldown, setSuggestCooldown] = useState(null);
  const [suggestionId, setSuggestionId] = useState(null);

  const handleSuggestDeck = async () => {
    if (!showSuggestDeck || suggesting) {
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

  return {
    suggesting,
    suggestStatus,
    suggestMessage,
    suggestCooldown,
    suggestionId,
    handleSuggestDeck,
  };
}