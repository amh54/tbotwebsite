
import { useCallback, useEffect, useMemo, useState } from "react";

import CardModal from "../components/cardmodal";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

import "../css/admincards.css";
import "../css/cardmodal.css";
import "../css/loading.css";

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
).replace(/\/+$/, "");

const EMPTY_FORM = {
  cardid: "",
  card_type: "",
  card_name: "",
  side: "Plants",
  title: "",
  cost: "",
  strength: "",
  health: "",
  stats: "",
  description: "",
  ability: "",
  thumbnail: "",
  traits: "",
  set_rarity: "",
  flavor_text: "",
  aliases: "",
  button: "",
  button_emoji: "",
  button2: "",
  button_emoji2: "",
};

const getCookie = (name) => {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmed = cookie.trim();

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }

  return "";
};

const ensureCsrfToken = async () => {
  const existingToken = getCookie("csrftoken");

  if (existingToken) {
    return existingToken;
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Unable to initialize CSRF protection (${response.status}).`,
    );
  }

  const token = getCookie("csrftoken");

  if (!token) {
    throw new Error("Django did not provide a CSRF token.");
  }

  return token;
};

const normalizeSide = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "zombie" || normalized === "zombies") {
    return "Zombies";
  }

  return "Plants";
};

const getNextCardId = (cards) => {
  const ids = cards
    .map((card) => Number(card.cardid))
    .filter((id) => Number.isFinite(id));

  if (ids.length === 0) {
    return 1;
  }

  return Math.max(...ids) + 1;
};

const extractStatValues = (stats) => {
  const value = String(stats || "").trim();

  if (!value) {
    return {
      cost: "",
      strength: "",
      health: "",
    };
  }

  const numbers = value.match(/\b\d+\b/g) || [];

  return {
    cost: numbers[0] || "",
    strength: numbers[1] || "",
    health: numbers[2] || "",
  };
};

const formFromCard = (card) => {
  const stats = String(card?.stats || "");
  const extracted = extractStatValues(stats);

  return {
    ...EMPTY_FORM,
    cardid: card?.cardid ?? "",
    card_type: card?.card_type ?? "",
    card_name: card?.card_name ?? "",
    side: normalizeSide(card?.side),
    title: card?.title ?? "",
    cost: extracted.cost,
    strength: extracted.strength,
    health: extracted.health,
    stats,
    description: card?.description ?? "",
    ability: card?.ability ?? "",
    thumbnail: card?.thumbnail ?? "",
    traits: card?.traits ?? "",
    set_rarity: card?.set_rarity ?? "",
    flavor_text: card?.flavor_text ?? "",
    aliases: card?.aliases ?? "",
    button: card?.button ?? "",
    button_emoji: card?.button_emoji ?? "",
    button2: card?.button2 ?? "",
    button_emoji2: card?.button_emoji2 ?? "",
  };
};

function AdminCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState("All");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedCard, setSelectedCard] = useState(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/cards/`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("You are not authorized to manage cards.");
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load cards (${response.status}).`,
        );
      }

      const data = await response.json();

      setCards(
        Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [],
      );
    } catch (err) {
      console.error("Unable to load admin cards:", err);
      setError(err?.message || "Unable to load cards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cards.filter((card) => {
      const matchesSide =
        sideFilter === "All" ||
        normalizeSide(card.side) === sideFilter;

      if (!matchesSide) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        card.cardid,
        card.card_name,
        card.title,
        card.card_type,
        card.side,
        card.set_rarity,
        card.aliases,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [cards, search, sideFilter]);

  const openAdd = () => {
    setEditingCard(null);

    setForm({
      ...EMPTY_FORM,
      cardid: getNextCardId(cards),
    });

    setError("");
    setSuccess("");
    setEditorOpen(true);
  };

  const openEdit = (card) => {
    setEditingCard(card);
    setForm(formFromCard(card));
    setError("");
    setSuccess("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving || uploadingImage) {
      return;
    }

    setEditorOpen(false);
    setEditingCard(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };
const handleImageUpload = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!form.card_name?.trim()) {
    setError("Card name is required before uploading an image.");
    event.target.value = "";
    return;
  }

  setUploadingImage(true);
  setError("");
  setSuccess("");

  try {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(
        "Image is too large. Maximum size is 10 MB.",
      );
    }

    const csrfToken = await ensureCsrfToken();

    const formData = new FormData();

    formData.append("image", file);
    formData.append(
      "card_name",
      String(form.card_name).trim(),
    );

    const response = await fetch(
      `${API_BASE_URL}/tbotapp/admin/cards/image-upload/`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formData,
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.detail ||
          `Unable to upload image (${response.status}).`,
      );
    }

    if (!data.secure_url && !data.url) {
      throw new Error(
        "Cloudinary upload succeeded, but no image URL was returned.",
      );
    }

    const imageUrl = data.secure_url || data.url;

    updateField("thumbnail", imageUrl);

    setSuccess(
      `${form.card_name} image uploaded successfully.`,
    );
  } catch (err) {
    console.error("Unable to upload card image:", err);

    setError(
      err?.message || "Unable to upload image.",
    );
  } finally {
    setUploadingImage(false);
    event.target.value = "";
  }
};

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const csrfToken = await ensureCsrfToken();
      const isEditing = Boolean(editingCard);

      if (!isEditing) {
        throw new Error(
          "Adding new cards is disabled while image-only editing is enabled.",
        );
      }

      const thumbnail = String(
        form.thumbnail || "",
      ).trim();

      if (!thumbnail) {
        throw new Error("Card image is required.");
      }

      const payload = {
        thumbnail,
      };

      const url =
        `${API_BASE_URL}/tbotapp/admin/cards/` +
        `${editingCard.cardid}/`;

      const response = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            `Unable to update card image (${response.status}).`,
        );
      }

      setSuccess(
        `${data.card_name || editingCard.card_name || "Card"} image updated successfully.`,
      );

      setEditorOpen(false);
      setEditingCard(null);
      setForm(EMPTY_FORM);

      await loadCards();
    } catch (err) {
      console.error("Unable to update card image:", err);

      setError(
        err?.message || "Unable to update card image.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (card) => {
    const confirmed = window.confirm(
      `Delete "${card.card_name || "this card"}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const csrfToken = await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/cards/${card.cardid}/delete/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            `Unable to delete card (${response.status}).`,
        );
      }

      if (
        selectedCard &&
        Number(selectedCard.cardid) === Number(card.cardid)
      ) {
        setSelectedCard(null);
      }

      setSuccess(
        `${card.card_name || "Card"} deleted successfully.`,
      );

      await loadCards();
    } catch (err) {
      console.error("Unable to delete card:", err);

      setError(
        err?.message || "Unable to delete card.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openCardModal = (card) => {
    setSelectedCard(card);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
  };

  return (
    <div className="admin-cards-page">
      <Navbar />

      <main className="admin-cards-content">
        <div className="admin-cards-header">
          <div>
            <h1>Card Manager</h1>
            <p>
              Add, edit, delete, and inspect Tbot cards.
            </p>
          </div>

          <button
            type="button"
            className="admin-cards-add-button"
            onClick={openAdd}
          >
            + Add Card
          </button>
        </div>

        {error && (
          <div className="admin-cards-message admin-cards-error">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-cards-message admin-cards-success">
            {success}
          </div>
        )}

        <section className="admin-cards-toolbar">
          <div className="admin-cards-search">
            <label htmlFor="admin-card-search">
              Search Cards
            </label>

            <input
              id="admin-card-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, ID, type, hero..."
            />
          </div>

          <div className="admin-cards-filter">
            <label htmlFor="admin-card-side">
              Side
            </label>

            <select
              id="admin-card-side"
              value={sideFilter}
              onChange={(event) =>
                setSideFilter(event.target.value)
              }
            >
              <option value="All">All</option>
              <option value="Plants">Plants</option>
              <option value="Zombies">Zombies</option>
            </select>
          </div>

          <div className="admin-cards-count">
            <strong>
              {filteredCards.length}
            </strong>

            <span>shown</span>
          </div>
        </section>

        {loading ? (
          <div className="admin-cards-loading">
            <div className="admin-cards-spinner" />
            <p>Loading cards...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="admin-cards-empty">
            <h2>No cards found</h2>

            <p>
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <section className="admin-cards-grid">
            {filteredCards.map((card) => (
              <article
                key={card.cardid}
                className="admin-card-item"
              >
                <button
                  type="button"
                  className="admin-card-image-button"
                  onClick={() =>
                    openCardModal(card)
                  }
                  title={`View ${card.card_name}`}
                >
                  {card.thumbnail ? (
                    <img
                      src={card.thumbnail}
                      alt={
                        card.card_name || "Card"
                      }
                      loading="lazy"
                    />
                  ) : (
                    <div className="admin-card-no-image">
                      No Image
                    </div>
                  )}
                </button>

                <div className="admin-card-item-info">
                  <div className="admin-card-item-top">
                    <span className="admin-card-id">
                      #{card.cardid}
                    </span>

                    <span
                      className={
                        `admin-card-side ` +
                        `admin-card-side-${normalizeSide(
                          card.side,
                        ).toLowerCase()}`
                      }
                    >
                      {normalizeSide(card.side)}
                    </span>
                  </div>

                  <h2>
                    {card.card_name ||
                      "Unnamed Card"}
                  </h2>

                  <p>
                    {card.card_type ||
                      "No card type"}
                  </p>

                  <div className="admin-card-item-actions">
                    <button
                      type="button"
                      className="admin-card-view-button"
                      onClick={() =>
                        openCardModal(card)
                      }
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="admin-card-edit-button"
                      onClick={() =>
                        openEdit(card)
                      }
                    >
                      Edit Image
                    </button>

                    <button
                      type="button"
                      className="admin-card-delete-button"
                      onClick={() =>
                        handleDelete(card)
                      }
                      disabled={deleting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />

      {editorOpen && (
        <div
          className="admin-card-editor-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <form
            className="admin-card-editor"
            onSubmit={handleSave}
          >
            <div className="admin-card-editor-header">
              <div>
                <h2>Edit Card Image</h2>

                <p>
                  {editingCard
                    ? `Editing #${editingCard.cardid} — ${editingCard.card_name}`
                    : "Create a new card"}
                </p>
              </div>

              <button
                type="button"
                className="admin-card-editor-close"
                onClick={closeEditor}
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                ×
              </button>
            </div>

            <div className="admin-card-editor-body">
              <section className="admin-card-form-section">
                <h3>Card Image</h3>

                <div className="admin-card-form-grid">
                  <div className="admin-card-form-full">
                    <label>
                      Thumbnail
                    </label>

                    <div className="admin-card-image-upload">
                      <input
                        id="admin-card-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={
                          handleImageUpload
                        }
                        disabled={
                          uploadingImage ||
                          saving
                        }
                      />

                      <label
                        htmlFor="admin-card-image"
                        className="admin-card-upload-button"
                      >
                        {uploadingImage
                          ? "Uploading..."
                          : "Choose Image"}
                      </label>

                      {form.thumbnail && (
                        <div className="admin-card-upload-preview">
                          <img
                            src={
                              form.thumbnail
                            }
                            alt="Card thumbnail preview"
                          />

                          <div>
                            <strong>
                              Uploaded
                            </strong>

                            <span>
                              Cloudinary image
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={
                        form.thumbnail
                      }
                      onChange={(event) =>
                        updateField(
                          "thumbnail",
                          event.target.value,
                        )
                      }
                      maxLength={330}
                      placeholder="Cloudinary URL"
                    />
                  </div>
                </div>
              </section>

              <section className="admin-card-form-section">
                <h3>Existing Card Information</h3>

                <div className="admin-card-form-grid">
                  <label>
                    Card ID

                    <input
                      type="text"
                      value={form.cardid}
                      readOnly
                    />
                  </label>

                  <label>
                    Card Name

                    <input
                      type="text"
                      value={
                        form.card_name
                      }
                      readOnly
                    />
                  </label>

                  <label>
                    Side

                    <input
                      type="text"
                      value={form.side}
                      readOnly
                    />
                  </label>

                  <label>
                    Card Type

                    <input
                      type="text"
                      value={
                        form.card_type
                      }
                      readOnly
                    />
                  </label>

                  <label>
                    Cost

                    <input
                      type="text"
                      value={form.cost}
                      readOnly
                    />
                  </label>

                  <label>
                    Strength

                    <input
                      type="text"
                      value={
                        form.strength
                      }
                      readOnly
                    />
                  </label>

                  <label>
                    Health

                    <input
                      type="text"
                      value={
                        form.health
                      }
                      readOnly
                    />
                  </label>

                  <label className="admin-card-form-full">
                    Stats

                    <input
                      type="text"
                      value={form.stats}
                      readOnly
                    />
                  </label>
                </div>

                <p>
                  Only the thumbnail will be changed when
                  you save. The existing stats and Discord
                  emoji IDs will not be modified.
                </p>
              </section>
            </div>

            <div className="admin-card-editor-footer">
              <button
                type="button"
                className="admin-card-cancel-button"
                onClick={closeEditor}
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-card-save-button"
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                {saving
                  ? "Saving..."
                  : "Save Image"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard}
          close={closeCardModal}
        />
      )}
    </div>
  );
}

export default AdminCards;
