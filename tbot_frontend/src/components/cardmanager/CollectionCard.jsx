import {
  getCardData,
  getQuantityValue,
  MAX_QUANTITY,
} from "../../utils/cardManagerUtils";

const CollectionCard = ({
  card,
  saving,
  deleting,
  onQuantityChange,
  onDecrease,
  onIncrease,
  onSave,
  onDelete,
}) => {
  const fullCard = getCardData(card);
  const quantity = getQuantityValue(card.quantity);

  return (
    <div className="collection-card">
      <div className="collection-card-image-wrapper">
        {fullCard?.thumbnail ? (
          <img
            className="collection-card-image"
            src={fullCard.thumbnail}
            alt={card.card_name}
          />
        ) : (
          <div className="collection-card-placeholder">
            {card.card_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
      </div>

      <div className="collection-card-content">
        <h3 className="collection-card-name">{card.card_name}</h3>

        {fullCard && (
          <div className="collection-card-meta">
            <span>{fullCard.side || "Unknown side"}</span>

            <span>{fullCard.card_type || "Unknown type"}</span>

            {fullCard.cost !== undefined && <span>Cost: {fullCard.cost}</span>}
          </div>
        )}

        <div className="collection-card-quantity">
          <button
            type="button"
            className="quantity-button"
            onClick={() => onDecrease(card)}
            disabled={quantity <= 0 || saving || deleting}
          >
            −
          </button>

          <input
            type="number"
            min="0"
            max={MAX_QUANTITY}
            value={card.quantity}
            onChange={(event) => onQuantityChange(card.id, event.target.value)}
            className="quantity-input"
            disabled={saving || deleting}
          />

          <button
            type="button"
            className="quantity-button"
            onClick={() => onIncrease(card)}
            disabled={quantity >= MAX_QUANTITY || saving || deleting}
          >
            +
          </button>
        </div>

        <div className="collection-card-actions">
          <button
            type="button"
            className="card-save-button"
            onClick={() => onSave(card)}
            disabled={saving || deleting}
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            className="card-delete-button"
            onClick={() => onDelete(card)}
            disabled={saving || deleting}
          >
            {deleting ? "Removing..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;
