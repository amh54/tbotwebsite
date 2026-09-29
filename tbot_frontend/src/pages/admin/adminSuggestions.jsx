import { useEffect, useMemo, useState } from "react";

import Footer from "../../components/footer.jsx";

import "../../css/admin/adminBugReports.css";
import "../../css/loading.css";
import "../../css/decklists.css";
import { ensureCsrfToken } from "../../utils/api.js";

import {
  getSuggestionId,
  getSuggestionTitle,
  getSuggestionDescription,
  getSuggestionCategory,
  getSuggestionStatus,
  normalizeStatus,
  normalizeText,
} from "../../utils/adminSuggestions.js";

import {
  deleteSuggestion,
  deleteUserDeckSuggestion,
  fetchSuggestions,
  fetchUserDeckSuggestions,
  saveSuggestionDetails,
  updateSuggestionStatus,
  updateUserDeckSuggestionStatus,
} from "../../utils/adminSuggestionsApi.js";

import SuggestionDetailsModal from "../../components/admin/suggestionDetailsModal.jsx";
import SuggestionEmptyState from "../../components/admin/suggestionEmptyState.jsx";
import SuggestionError from "../../components/admin/suggestionError.jsx";
import SuggestionList from "../../components/admin/suggestionList.jsx";
import SuggestionLoading from "../../components/admin/suggestionLoading.jsx";
import SuggestionStats from "../../components/admin/suggestionStats.jsx";
import SuggestionToolbar from "../../components/admin/suggestionToolbar.jsx";
import UserDeckSuggestionCard from "../../components/decks/userDeckSuggestionCard.jsx";

function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [deckSuggestions, setDeckSuggestions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deckError, setDeckError] = useState("");

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingDeckId, setUpdatingDeckId] = useState(null);
  const [deletingDeckId, setDeletingDeckId] = useState(null);

  const [actionError, setActionError] = useState("");

  const [adminResponse, setAdminResponse] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    document.title = "Admin - Suggestions";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error("Unable to initialize CSRF:", err);
    });
  }, []);

  const loadDeckSuggestions = async () => {
    try {
      setDeckError("");

      const results = await fetchUserDeckSuggestions();

      setDeckSuggestions(results);
    } catch (err) {
      console.error("Unable to load deck suggestions:", err);
      setDeckError(err.message || "Unable to load deck suggestions right now.");
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError("");

      const [results] = await Promise.all([
        fetchSuggestions(),
        loadDeckSuggestions(),
      ]);

      setSuggestions(results);
    } catch (err) {
      console.error("Unable to load suggestions:", err);
      setError(err.message || "Unable to load suggestions right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const filteredSuggestions = useMemo(() => {
    const query = normalizeText(search);

    return suggestions.filter((suggestion) => {
      const status = normalizeStatus(getSuggestionStatus(suggestion));
      const category = normalizeText(getSuggestionCategory(suggestion));

      const searchText = [
        getSuggestionTitle(suggestion),
        getSuggestionDescription(suggestion),
        getSuggestionCategory(suggestion),
        suggestion?.discord_username,
        suggestion?.username,
        suggestion?.display_name,
        suggestion?.discord_id,
        suggestion?.browser,
        suggestion?.operating_system,
        suggestion?.page_url,
        suggestion?.admin_response,
        suggestion?.admin_notes,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .join(" ");

      const matchesSearch = !query || searchText.includes(query);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suggestions, search, statusFilter, categoryFilter]);

  const filteredDeckSuggestions = useMemo(() => {
    const query = normalizeText(search);

    return deckSuggestions.filter((deckSuggestion) => {
      const status = normalizeStatus(deckSuggestion?.status);

      const searchText = [
        deckSuggestion?.deck_name,
        deckSuggestion?.hero,
        deckSuggestion?.category,
        deckSuggestion?.archetype,
        deckSuggestion?.creator,
        deckSuggestion?.description,
        deckSuggestion?.consent_status,
        deckSuggestion?.suggested_by_username,
        deckSuggestion?.suggested_by_display_name,
        deckSuggestion?.suggested_by_discord_id,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .join(" ");

      const matchesSearch = !query || searchText.includes(query);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deckSuggestions, search, statusFilter]);

  const counts = useMemo(() => {
    const result = {
      all: suggestions.length,
      pending: 0,
      reviewing: 0,
      planned: 0,
      completed: 0,
      declined: 0,
    };

    suggestions.forEach((suggestion) => {
      const status = normalizeStatus(getSuggestionStatus(suggestion));

      if (result[status] !== undefined) {
        result[status] += 1;
      }
    });

    return result;
  }, [suggestions]);

  const handleStatusChange = async (suggestion, newStatus) => {
    const suggestionId = getSuggestionId(suggestion);

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This suggestion does not have a valid ID.");
      return;
    }

    const normalizedStatus = normalizeStatus(newStatus);

    try {
      setUpdatingId(suggestionId);
      setActionError("");

      const updatedSuggestion = await updateSuggestionStatus(
        suggestionId,
        normalizedStatus,
      );

      setSuggestions((currentSuggestions) =>
        currentSuggestions.map((currentSuggestion) =>
          String(getSuggestionId(currentSuggestion)) === String(suggestionId)
            ? updatedSuggestion || {
                ...currentSuggestion,
                status: normalizedStatus,
              }
            : currentSuggestion,
        ),
      );

      setSelectedSuggestion((current) => {
        if (!current) {
          return current;
        }

        if (String(getSuggestionId(current)) !== String(suggestionId)) {
          return current;
        }

        return (
          updatedSuggestion || {
            ...current,
            status: normalizedStatus,
          }
        );
      });
    } catch (error) {
      console.error("Unable to update suggestion:", error);

      setActionError(
        error instanceof Error ? error.message : "Unable to update suggestion.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeckStatusChange = async (deckSuggestion, newStatus) => {
    const suggestionId = deckSuggestion?.id;

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This deck suggestion does not have a valid ID.");
      return;
    }

    const normalizedStatus = normalizeStatus(newStatus);

    try {
      setUpdatingDeckId(suggestionId);
      setActionError("");

      const updatedSuggestion = await updateUserDeckSuggestionStatus(
        suggestionId,
        normalizedStatus,
      );

      setDeckSuggestions((currentSuggestions) =>
        currentSuggestions.map((currentSuggestion) =>
          String(currentSuggestion.id) === String(suggestionId)
            ? updatedSuggestion || {
                ...currentSuggestion,
                status: normalizedStatus,
              }
            : currentSuggestion,
        ),
      );
    } catch (error) {
      console.error("Unable to update deck suggestion:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update deck suggestion.",
      );
    } finally {
      setUpdatingDeckId(null);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedSuggestion) {
      return;
    }

    const suggestionId = getSuggestionId(selectedSuggestion);

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This suggestion does not have a valid ID.");
      return;
    }

    try {
      setSavingDetails(true);
      setActionError("");

      const updatedSuggestion = await saveSuggestionDetails(suggestionId, {
        admin_response: adminResponse,
        admin_notes: adminNotes,
      });

      const updated = updatedSuggestion || {
        ...selectedSuggestion,
        admin_response: adminResponse,
        admin_notes: adminNotes,
      };

      setSuggestions((currentSuggestions) =>
        currentSuggestions.map((currentSuggestion) =>
          String(getSuggestionId(currentSuggestion)) === String(suggestionId)
            ? updated
            : currentSuggestion,
        ),
      );

      setSelectedSuggestion(updated);
    } catch (error) {
      console.error("Unable to save suggestion details:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to save suggestion details.",
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDelete = async (suggestion) => {
    const suggestionId = getSuggestionId(suggestion);

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This suggestion does not have a valid ID.");
      return;
    }

    const title = getSuggestionTitle(suggestion);

    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(suggestionId);
      setActionError("");

      await deleteSuggestion(suggestionId);

      setSuggestions((currentSuggestions) =>
        currentSuggestions.filter(
          (currentSuggestion) =>
            String(getSuggestionId(currentSuggestion)) !== String(suggestionId),
        ),
      );

      setSelectedSuggestion((current) => {
        if (!current) {
          return null;
        }

        return String(getSuggestionId(current)) === String(suggestionId)
          ? null
          : current;
      });
    } catch (err) {
      console.error("Unable to delete suggestion:", err);

      setActionError(err.message || "Unable to delete suggestion.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeckDelete = async (deckSuggestion) => {
    const suggestionId = deckSuggestion?.id;

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This deck suggestion does not have a valid ID.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${deckSuggestion?.deck_name || "this deck suggestion"}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDeckId(suggestionId);
      setActionError("");

      await deleteUserDeckSuggestion(suggestionId);

      setDeckSuggestions((currentSuggestions) =>
        currentSuggestions.filter(
          (currentSuggestion) =>
            String(currentSuggestion.id) !== String(suggestionId),
        ),
      );
    } catch (err) {
      console.error("Unable to delete deck suggestion:", err);

      setActionError(err.message || "Unable to delete deck suggestion.");
    } finally {
      setDeletingDeckId(null);
    }
  };

  const openDetails = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminResponse(suggestion?.admin_response || "");
    setAdminNotes(suggestion?.admin_notes || "");
    setActionError("");
  };

  const closeDetails = () => {
    setSelectedSuggestion(null);
    setAdminResponse("");
    setAdminNotes("");
  };

  const showSiteSuggestions = categoryFilter !== "deck";

  const showDeckSuggestions =
    categoryFilter === "all" || categoryFilter === "deck";

  if (loading) {
    return <SuggestionLoading />;
  }

  return (
    <div className="admin-bugreports-page">
      <main className="admin-bugreports-content">
        <div className="admin-bugreports-topbar">
          <div>
            <span className="admin-bugreports-eyebrow">ADMINISTRATION</span>

            <h1>Suggestions</h1>

            <p>
              Review, manage, and respond to suggestions submitted by the Tbot
              community.
            </p>
          </div>

          <div className="admin-bugreports-actions">
            <button
              type="button"
              className="admin-bugreports-back"
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              ← Admin
            </button>

            <button
              type="button"
              className="admin-bugreports-refresh"
              onClick={loadSuggestions}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {error && (
          <SuggestionError title="Unable to load suggestions" message={error} />
        )}

        {actionError && (
          <SuggestionError
            title="Action failed"
            message={actionError}
            onClose={() => setActionError("")}
          />
        )}

        {!error && (
          <>
            <SuggestionStats
              counts={counts}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            <SuggestionToolbar
              search={search}
              setSearch={setSearch}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            {showSiteSuggestions && (
              <>
                <div className="admin-bugreports-results">
                  <span>
                    Showing <strong>{filteredSuggestions.length}</strong> of{" "}
                    <strong>{suggestions.length}</strong> suggestions
                  </span>
                </div>

                {filteredSuggestions.length === 0 ? (
                  <SuggestionEmptyState
                    search={search}
                    statusFilter={statusFilter}
                    categoryFilter={categoryFilter}
                    clearFilters={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setCategoryFilter("all");
                    }}
                  />
                ) : (
                  <SuggestionList
                    suggestions={filteredSuggestions}
                    updatingId={updatingId}
                    deletingId={deletingId}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onViewDetails={openDetails}
                  />
                )}
              </>
            )}

            {showDeckSuggestions && (
              <>
                <h2>Deck Suggestions</h2>

                {deckError && (
                  <SuggestionError
                    title="Unable to load deck suggestions"
                    message={deckError}
                  />
                )}

                {!deckError && (
                  <>
                    <div className="admin-bugreports-results">
                      <span>
                        Showing <strong>{filteredDeckSuggestions.length}</strong>{" "}
                        of <strong>{deckSuggestions.length}</strong> deck
                        suggestions
                      </span>
                    </div>

                    {filteredDeckSuggestions.length === 0 ? (
                      <p>No deck suggestions match the current filters.</p>
                    ) : (
                      <div className="deck-grid">
                        {filteredDeckSuggestions.map((deckSuggestion) => (
                          <UserDeckSuggestionCard
                            key={deckSuggestion.id}
                            suggestion={deckSuggestion}
                            admin
                            updatingId={updatingDeckId}
                            deletingId={deletingDeckId}
                            onStatusChange={handleDeckStatusChange}
                            onDelete={handleDeckDelete}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />

      {selectedSuggestion && (
        <SuggestionDetailsModal
          suggestion={selectedSuggestion}
          adminResponse={adminResponse}
          setAdminResponse={setAdminResponse}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          savingDetails={savingDetails}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
          onSave={handleSaveDetails}
          onDelete={handleDelete}
          onClose={closeDetails}
        />
      )}
    </div>
  );
}

export default AdminSuggestions;