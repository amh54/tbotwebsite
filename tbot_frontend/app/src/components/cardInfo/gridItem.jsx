import { getRarityName, getSetName } from "../../utils/cardInfo/dataUtils.js";
import {
  renderAbilityText,
  renderStatsText,
  renderTitleText,
  renderTraitText,
} from "../../utils/cardInfo/renderUtils.jsx";
import { hasValue } from "../../utils/cardInfo/textUtils.js";

function GridItem({ card, userCollection, onOpen }) {
  return (
    <div
      className="card-item"
      data-rarity={getRarityName(card.set_rarity)}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(card)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(card);
        }
      }}
    >
      <div className="card-item-media">
        <img
          src={card.thumbnail}
          alt={card.card_name}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="card-item-info">
        <h2 className="card-item-title">
          {hasValue(card?.title)
            ? renderTitleText(card.title)
            : card?.card_name || "Unknown Card"}
        </h2>

        {userCollection && card?.quantity !== undefined && (
          <p>
            <span>Copies:</span> {card.quantity}x
          </p>
        )}

        {hasValue(card.card_type) && (
          <p>
            <span>Class:</span> {card.card_type}
          </p>
        )}

        {hasValue(card.traits) && (
          <p className="card-traits-line">
            <span className="card-field-label">Traits:</span>

            <span className="card-traits-value">
              {renderTraitText(String(card.traits))}
            </span>
          </p>
        )}

        {hasValue(card.stats) && (
          <p className="card-stats-line">
            <span className="card-field-label">Stats:</span>

            <span className="card-stats-value">
              {renderStatsText(String(card.stats))}
            </span>
          </p>
        )}

        {hasValue(card.set_rarity) && getSetName(card.set_rarity) && (
          <p>
            <span>Set:</span> {getSetName(card.set_rarity)}
          </p>
        )}

        {hasValue(card.set_rarity) && getRarityName(card.set_rarity) && (
          <p>
            <span>Rarity:</span> {getRarityName(card.set_rarity)}
          </p>
        )}

        {hasValue(card.ability) && (
          <p className="card-description-line">
            <span className="card-field-label">Ability:</span>{" "}
            <span
              style={{
                whiteSpace: "pre-line",
              }}
            >
              {renderAbilityText(card.ability)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default GridItem;