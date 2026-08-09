import "../css/cardmodal.css";

const MANUAL_STAT_IMAGE_LINKS = {
  default: {
    cost: "https://i.ibb.co/Q30j2CgC/brainz.webp",
    strength: "https://i.ibb.co/GQt785K6/strength.webp",
    health: "https://i.ibb.co/bMj86Wvg/health.webp",
    antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
  },
};

function CardModal({ card, close }) {
  const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";
  const description = hasValue(card.description) ? card.description : "No description available.";
  const traitsText = hasValue(card.traits) ? String(card.traits) : "";
  const abilityText = hasValue(card.ability) ? String(card.ability) : "";
  const isAntihero = /anti[-\s]?hero/i.test(traitsText);
  const antiheroMatch = /anti[-\s]?hero(?:\s*\d+)?/i.exec(traitsText);
  const abilitySegments = abilityText ? abilityText.split(/(\+1\/\+1)/g) : [];

  const getManualStatImageUrl = (statKey) => {
    const cardKey = card.card_name || card.title || "";
    const statImages =
      MANUAL_STAT_IMAGE_LINKS[cardKey] || MANUAL_STAT_IMAGE_LINKS.default || {};

    const override =
      (statKey === "strength" && isAntihero
        ? statImages.antihero || MANUAL_STAT_IMAGE_LINKS.default?.antihero
        : statImages[statKey] || MANUAL_STAT_IMAGE_LINKS[statKey]) || "";

    return String(override).trim();
  };

  const statRows = [
    {
      label: "Cost",
      value: card.cost,
      imageUrl: getManualStatImageUrl("cost"),
    },
    {
      label: "Strength",
      value: card.strength,
      imageUrl: getManualStatImageUrl("strength"),
    },
    {
      label: "Health",
      value: card.health,
      imageUrl: getManualStatImageUrl("health"),
    },
  ];

  const hasStats = statRows.some((row) => hasValue(row.value) || hasValue(row.imageUrl));

  return (
    <div className="card-overlay">
      <div className="card-modal">
        <button type="button" className="close-card" onClick={close}>
          ×
        </button>

        <img
          className="modal-card-image"
          src={card.thumbnail}
          alt={card.card_name}
        />

        <div className="modal-info">
          <div className="modal-header">
            <h2 className="modal-title">{card.card_name}</h2>

            <span className="card-type">{card.card_type}</span>
          </div>

          <section className="modal-section description-section">
            <h3>Description</h3>

            <p className="description-text">{description}</p>
          </section>

          <section className="modal-metadata">
            {hasStats && (
              <div className="metadata-item stats-item">
                <span className="label">Stats</span>

                <div className="stat-list">
                  {statRows.map((row) => {
                    if (!hasValue(row.value) && !hasValue(row.imageUrl)) {
                      return null;
                    }

                    const statValue = hasValue(row.value) ? row.value : "-";

                    return (
                      <span className="stat-row" key={row.label}>
                        <span className="stat-value">{statValue}</span>

                        {hasValue(row.imageUrl) && (
                          <a
                            className="stat-image-link"
                            href={row.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${row.label} image link`}
                          >
                            <img src={row.imageUrl} alt={row.label} />
                          </a>
                        )}

                        {row.label !== statRows.at(-1).label && (
                          <span className="stat-separator">,</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {hasValue(card.ability) && (
              <div className="metadata-item">
                <span className="label">Ability</span>

                <span className="value ability-value">
                  {abilitySegments.length > 0 ? (
                    abilitySegments.map((segment, index) =>
                      segment === "+1/+1" ? (
                        <span className="ability-stat-pair" key={`${segment}-${index}`}>
                          <span className="ability-stat-value">+1</span>
                          <img
                            className="ability-stat-icon"
                            src={MANUAL_STAT_IMAGE_LINKS.default.strength}
                            alt="Attack"
                          />
                          <span className="ability-stat-slash">/</span>
                          <span className="ability-stat-value">+1</span>
                          <img
                            className="ability-stat-icon"
                            src={MANUAL_STAT_IMAGE_LINKS.default.health}
                            alt="Health"
                          />
                        </span>
                      ) : (
                        <span key={`${segment}-${index}`}>{segment}</span>
                      ),
                    )
                  ) : (
                    card.ability
                  )}
                </span>
              </div>
            )}

            {hasValue(card.traits) && (
              <div className="metadata-item trait-item">
                <span className="label">Traits</span>

                <span className="value trait-value">
                  {isAntihero && antiheroMatch ? (
                    <>
                      <span>{traitsText.slice(0, antiheroMatch.index)}</span>

                      <img
                        className="trait-icon"
                        src={MANUAL_STAT_IMAGE_LINKS.default.antihero}
                        alt="Antihero"
                      />

                      <span>{antiheroMatch[0]}</span>

                      <span>{traitsText.slice(antiheroMatch.index + antiheroMatch[0].length)}</span>
                    </>
                  ) : (
                    <span>{traitsText}</span>
                  )}
                </span>
              </div>
            )}

            {hasValue(card.set_rarity) && (
              <div className="metadata-item">
                <span className="label">Rarity</span>

                <span className="value">{card.set_rarity}</span>
              </div>
            )}

            {hasValue(card.flavor_text) && (
              <div className="metadata-item full-width-item">
                <span className="label">Flavor Text</span>

                <span className="value">{card.flavor_text}</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
