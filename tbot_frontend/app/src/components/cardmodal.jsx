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
    freeze: "https://i.ibb.co/hFPRcrp6/freeze.webp",
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

  const statsText = hasValue(card.stats) ? String(card.stats) : "";

  const isAntihero = /anti[-\s]?hero/i.test(traitsText);
  const isStrikethrough = /strikethrough/i.test(traitsText);
  const isDeadly = /deadly/i.test(traitsText);

  const antiheroMatch = /anti[-\s]?hero(?:\s\*+\d+)?/i.exec(traitsText);

  const strikethroughMatch = /strikethrough(?:\s\*+\d+)?/i.exec(traitsText);

  const deadlyMatch = /deadly(?:\s\*+\d+)?/i.exec(traitsText);

  const renderIconTrait = (match, iconUrl, iconAlt, text) => {
    if (!match) {
      return <span>{text}</span>;
    }

    return (
      <>
        <span>{text.slice(0, match.index)}</span>

        <img className="trait-icon" src={iconUrl} alt={iconAlt} />

        <span>{match[0]}</span>

        <span>{text.slice(match.index + match[0].length)}</span>
      </>
    );
  };

  /*
   * Description intentionally only formats the existing
   * trigger phrases.
   */
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

  /*
   * Converts Discord custom emojis into website icons.
   */
  const getEmojiIcon = (emoji) => {
    const normalized = String(emoji || "").toLowerCase();

    if (normalized.startsWith("<:brainz:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.default.cost,
        alt: "Brainz",
      };
    }

    if (normalized.startsWith("<:strength:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.default.strength,
        alt: "Strength",
      };
    }

    if (normalized.startsWith("<:health:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.default.health,
        alt: "Health",
      };
    }

    if (normalized.startsWith("<:deadly:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.default.deadly,
        alt: "Deadly",
      };
    }

    if (normalized.startsWith("<:freeze:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.default.freeze,
        alt: "Freeze",
      };
    }

    if (normalized.startsWith("<:antihero:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.default.antihero,
        alt: "Antihero",
      };
    }

    if (normalized.startsWith("<:strikethrough:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.default.strikethrough,
        alt: "Strikethrough",
      };
    }

    return null;
  };

  /*
   * Stats:
   *
   * Discord emoji IDs in the stats database field
   * are converted into the appropriate website images.
   *
   * Everything else stays exactly as it appears
   * in the database.
   */
  const renderStatsText = (stats) => {
    if (!stats) {
      return null;
    }

    const text = String(stats);

    const pattern = /(<:[^:>]+:\d+>)/gi;

    const matches = [...text.matchAll(pattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`stats-text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      const icon = getEmojiIcon(fullMatch);

      if (icon) {
        parts.push(
          <img
            key={`stats-icon-${index}`}
            className="ability-stat-icon"
            src={icon.url}
            alt={icon.alt}
          />,
        );
      } else {
        parts.push(<span key={`stats-unknown-${index}`}>{fullMatch}</span>);
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="stats-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  /*
   * Ability formatting:
   *
   * <Discord emoji> -> image
   * **__text__**    -> bold + underline
   * __**text**__    -> bold + underline
   * **text**        -> bold
   * __text__        -> underline
   */
  const renderAbilityText = (ability) => {
    if (!ability) {
      return null;
    }

    const text = String(ability);

    const pattern =
      /(<:[^:>]+:\d+>)|(\*\*__[\s\S]*?__\*\*)|(__\*\*[\s\S]*?\*\*__)|(\*\*[\s\S]*?\*\*)|(__[\s\S]*?__)/gi;

    const matches = [...text.matchAll(pattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      /*
       * Discord custom emoji
       */
      if (match[1]) {
        const icon = getEmojiIcon(match[1]);

        if (icon) {
          parts.push(
            <img
              key={`icon-${index}`}
              className="ability-stat-icon"
              src={icon.url}
              alt={icon.alt}
            />,
          );
        } else {
          parts.push(<span key={`unknown-emoji-${index}`}>{match[1]}</span>);
        }
      } else if (match[2]) {

      /*
       * **__text__**
       */
        const formattedText = match[2].slice(4, -4);

        parts.push(
          <strong key={`bold-underline-${index}`}>
            <u>{formattedText}</u>
          </strong>,
        );
      } else if (match[3]) {

      /*
       * __**text**__
       */
        const formattedText = match[3].slice(4, -4);

        parts.push(
          <strong key={`underline-bold-${index}`}>
            <u>{formattedText}</u>
          </strong>,
        );
      } else if (match[4]) {

      /*
       * **text**
       */
        const formattedText = match[4].slice(2, -2);

        parts.push(<strong key={`bold-${index}`}>{formattedText}</strong>);
      } else if (match[5]) {

      /*
       * __text__
       */
        const formattedText = match[5].slice(2, -2);

        parts.push(<u key={`underline-${index}`}>{formattedText}</u>);
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const hasStats = hasValue(card.stats);

  return (
    <div className="card-overlay" onClick={close}>
      <div className="card-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="close-card"
          onClick={close}
          aria-label="Close card"
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

                <span className="value stats-value">
                  {renderStatsText(statsText)}
                </span>
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
