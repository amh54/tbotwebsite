import "../css/cardmodal.css";

const ICON_LINKS = {
  brainz: "https://i.ibb.co/Q30j2CgC/brainz.webp",
  strength: "https://i.ibb.co/GQt785K6/strength.webp",
  health: "https://i.ibb.co/bMj86Wvg/health.webp",
  antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
  strikethrough: "https://i.ibb.co/99KG7vjj/strikethrough.webp",
  deadly: "https://i.ibb.co/xt6pkMT1/deadly.webp",
  special: "https://i.ibb.co/Sw0yS0Mg/special.webp",
  freeze: "https://i.ibb.co/hFPRcrp6/freeze.webp",
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

  const getEmojiIcon = (emoji) => {
    const normalized = String(emoji || "").toLowerCase();

    if (normalized.startsWith("<:brainz:")) {
      return {
        url: ICON_LINKS.brainz,
        alt: "Brainz",
      };
    }

    if (normalized.startsWith("<:strength:")) {
      return {
        url: ICON_LINKS.strength,
        alt: "Strength",
      };
    }

    if (normalized.startsWith("<:health:")) {
      return {
        url: ICON_LINKS.health,
        alt: "Health",
      };
    }

    if (normalized.startsWith("<:antihero:")) {
      return {
        url: ICON_LINKS.antihero,
        alt: "Antihero",
      };
    }

    if (normalized.startsWith("<:strikethrough:")) {
      return {
        url: ICON_LINKS.strikethrough,
        alt: "Strikethrough",
      };
    }

    if (normalized.startsWith("<:deadly:")) {
      return {
        url: ICON_LINKS.deadly,
        alt: "Deadly",
      };
    }

    if (normalized.startsWith("<:special:")) {
      return {
        url: ICON_LINKS.special,
        alt: "Special",
      };
    }

    if (normalized.startsWith("<:freeze:")) {
      return {
        url: ICON_LINKS.freeze,
        alt: "Freeze",
      };
    }

    return null;
  };

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
        return <strong key={`description-${index}`}>{segment}</strong>;
      }

      return <span key={`description-${index}`}>{segment}</span>;
    });
  };

  const renderStatsText = (stats) => {
    if (!stats) {
      return null;
    }

    const text = String(stats);
    const emojiPattern = /(<:[^:>]+:\d+>)/gi;
    const matches = [...text.matchAll(emojiPattern)];

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
          <span key={`ability-text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      if (match[1]) {
        const icon = getEmojiIcon(match[1]);

        if (icon) {
          parts.push(
            <img
              key={`ability-icon-${index}`}
              className="ability-stat-icon"
              src={icon.url}
              alt={icon.alt}
            />,
          );
        } else {
          parts.push(<span key={`ability-unknown-${index}`}>{match[1]}</span>);
        }
      } else if (match[2]) {
        const formattedText = match[2].slice(4, -4);

        parts.push(
          <strong key={`bold-underline-${index}`}>
            <u>{formattedText}</u>
          </strong>,
        );
      } else if (match[3]) {
        const formattedText = match[3].slice(4, -4);

        parts.push(
          <strong key={`underline-bold-${index}`}>
            <u>{formattedText}</u>
          </strong>,
        );
      } else if (match[4]) {
        const formattedText = match[4].slice(2, -2);

        parts.push(<strong key={`bold-${index}`}>{formattedText}</strong>);
      } else if (match[5]) {
        const formattedText = match[5].slice(2, -2);

        parts.push(<u key={`underline-${index}`}>{formattedText}</u>);
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="ability-text-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const renderTraitText = (text) => {
    if (!text) {
      return null;
    }

    const traitPattern =
      /(anti[-\s]?hero|strikethrough|deadly)(?:\s+\*+\d+)?/gi;

    const matches = [...String(text).matchAll(traitPattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const matchText = match[0];
      const traitName = match[1].toLowerCase();

      if (match.index > lastIndex) {
        parts.push(
          <span key={`trait-text-${index}`}>
            {text.slice(lastIndex, match.index)}
          </span>,
        );
      }

      let iconUrl = "";
      let iconAlt = "";

      if (traitName.startsWith("anti")) {
        iconUrl = ICON_LINKS.antihero;
        iconAlt = "Antihero";
      } else if (traitName === "strikethrough") {
        iconUrl = ICON_LINKS.strikethrough;
        iconAlt = "Strikethrough";
      } else if (traitName === "deadly") {
        iconUrl = ICON_LINKS.deadly;
        iconAlt = "Deadly";
      }

      parts.push(
        <span className="trait-with-icon" key={`trait-${index}`}>
          <img className="trait-icon" src={iconUrl} alt={iconAlt} />
          <span>{matchText}</span>
        </span>,
      );

      lastIndex = match.index + matchText.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="trait-text-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="card-modal" onClick={(event) => event.stopPropagation()}>
      <button
        className="card-modal-close"
        type="button"
        onClick={close}
        aria-label="Close"
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
          {hasValue(card.stats) && (
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
                {renderTraitText(traitsText)}
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
  );
}

export default CardModal;
