import "../css/cardmodal.css";

const MANUAL_STAT_IMAGE_LINKS = {
  default: {
    cost: "https://i.ibb.co/Q30j2CgC/brainz.webp",
    strength: "https://i.ibb.co/GQt785K6/strength.webp",
    health: "https://i.ibb.co/bMj86Wvg/health.webp",
    antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
    strikethrough: "https://i.ibb.co/99KG7vjj/strikethrough.webp",
    deadly: "https://i.ibb.co/xt6pkMT1/deadly.webp",
    special: "https://i.ibb.co/Sw0yS0Mg/special.webp",
  },
};

function CardModal({ card, close }) {
  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";

  const description = hasValue(card.description)
    ? String(card.description)
    : "No description available.";

  const traitsText = hasValue(card.traits) ? String(card.traits) : "";

  const abilityText = hasValue(card.ability) ? String(card.ability) : "";

  const isAntihero = /anti[-\s]?hero/i.test(traitsText);
  const isStrikethrough = /strikethrough/i.test(traitsText);
  const isDeadly = /deadly/i.test(traitsText);

  const antiheroMatch = /anti[-\s]?hero(?:\s\*\d+)?/i.exec(traitsText);

  const strikethroughMatch = /strikethrough(?:\s\*\d+)?/i.exec(traitsText);

  const deadlyMatch = /deadly(?:\s\*\d+)?/i.exec(traitsText);

  const renderIconTrait = (match, iconUrl, iconAlt, text) => (
    <>
      <span>{text.slice(0, match.index)}</span>

      <img className="trait-icon" src={iconUrl} alt={iconAlt} />

      <span>{match[0]}</span>

      <span>{text.slice(match.index + match[0].length)}</span>
    </>
  );

  const renderDescriptionText = (text) => {
    if (!text) {
      return null;
    }

    const triggerPattern =
      /(when revealed in an environment|when revealed on heights|when this enters a lane|when hurt|when destroyed|when revealed|zombie evolution|end of turn)/gi;

    const segments = String(text).split(triggerPattern);

    return segments.map((segment, index) => {
      if (
        /^(when revealed in an environment|when revealed on heights|when this enters a lane|when hurt|when destroyed|when revealed|zombie evolution|end of turn)$/i.test(
          segment.trim(),
        )
      ) {
        return <strong key={`${segment}-${index}`}>{segment}</strong>;
      }

      return <span key={`${segment}-${index}`}>{segment}</span>;
    });
  };

  const renderAbilityText = (ability) => {
    if (!ability) {
      return null;
    }

    const segments = ability.split(/(\+1\/\+1|conjure)/gi);

    return segments.map((segment, index) => {
      if (segment === "+1/+1") {
        return (
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
        );
      }

      if (/^conjure$/i.test(segment)) {
        return (
          <span key={`${segment}-${index}`} className="conjure-text">
            {segment}
          </span>
        );
      }

      return <span key={`${segment}-${index}`}>{segment}</span>;
    });
  };

  const getManualStatImageUrl = (statKey) => {
    const cardKey = card.card_name || card.title || "";

    const statImages =
      MANUAL_STAT_IMAGE_LINKS[cardKey] || MANUAL_STAT_IMAGE_LINKS.default || {};

    const override =
      statKey === "strength" && isDeadly && isStrikethrough
        ? statImages.special || MANUAL_STAT_IMAGE_LINKS.default?.special
        : statKey === "strength" && isDeadly
          ? statImages.deadly || MANUAL_STAT_IMAGE_LINKS.default?.deadly
          : statImages[statKey] || MANUAL_STAT_IMAGE_LINKS[statKey] || "";

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

  const visibleStatRows = statRows.filter(
    (row) => hasValue(row.value) || hasValue(row.imageUrl),
  );

  const hasStats = visibleStatRows.length > 0;

  return (
    <div className="card-overlay">
      <div className="card-modal">
        <button
          type="button"
          className="close-card"
          onClick={close}
          aria-label="Close card details"
        >
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

            <p className="description-text">
              {renderDescriptionText(description)}
            </p>
          </section>

          <section className="modal-metadata">
            {hasStats && (
              <div className="metadata-item stats-item">
                <span className="label">Stats</span>

                <div className="stat-list">
                  {visibleStatRows.map((row, index) => {
                    const statValue = hasValue(row.value) ? row.value : "-";

                    const isLast = index === visibleStatRows.length - 1;

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

                        {!isLast && <span className="stat-separator">,</span>}
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
                  {renderAbilityText(abilityText)}
                </span>
              </div>
            )}

            {hasValue(card.traits) && (
              <div className="metadata-item trait-item">
                <span className="label">Traits</span>

                <span className="value trait-value">
                  {isAntihero && antiheroMatch ? (
                    renderIconTrait(
                      antiheroMatch,
                      MANUAL_STAT_IMAGE_LINKS.default.antihero,
                      "Antihero",
                      traitsText,
                    )
                  ) : isStrikethrough && strikethroughMatch ? (
                    renderIconTrait(
                      strikethroughMatch,
                      MANUAL_STAT_IMAGE_LINKS.default.strikethrough,
                      "Strikethrough",
                      traitsText,
                    )
                  ) : isDeadly && deadlyMatch ? (
                    renderIconTrait(
                      deadlyMatch,
                      MANUAL_STAT_IMAGE_LINKS.default.deadly,
                      "Deadly",
                      traitsText,
                    )
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
