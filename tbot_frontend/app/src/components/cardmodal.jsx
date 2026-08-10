import "../css/cardmodal.css";

const MANUAL_STAT_IMAGE_LINKS = {
  cost: "https://i.ibb.co/Q30j2CgC/brainz.webp",
  strength: "https://i.ibb.co/GQt785K6/strength.webp",
  health: "https://i.ibb.co/bMj86Wvg/health.webp",
  sun: "https://i.ibb.co/3mwp3d6s/sun.webp",

  antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
  strikethrough: "https://i.ibb.co/99KG7vjj/strikethrough.webp",
  deadly: "https://i.ibb.co/xt6pkMT1/deadly.webp",
  special: "https://i.ibb.co/Sw0yS0Mg/special.webp",
  freeze: "https://i.ibb.co/hFPRcrp6/freeze.webp",
  bullseye: "https://i.ibb.co/tTp9zzdh/Bullseye.webp",
  frenzy: "https://i.ibb.co/0RC4sW0b/frenzy.webp",
  armored: "https://i.ibb.co/SXTYdVry/armored.webp",
  overshoot: "https://i.ibb.co/prbYt2DX/overshoot.webp",
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
        url: MANUAL_STAT_IMAGE_LINKS.cost,
        alt: "Brainz",
      };
    }

    if (normalized.startsWith("<:strength:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.strength,
        alt: "Strength",
      };
    }

    if (normalized.startsWith("<:health:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.health,
        alt: "Health",
      };
    }

    if (normalized.startsWith("<:sun:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.sun,
        alt: "Sun",
      };
    }

    if (normalized.startsWith("<:antihero:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.antihero,
        alt: "Anti-Hero",
      };
    }

    if (normalized.startsWith("<:strikethrough:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.strikethrough,
        alt: "Strikethrough",
      };
    }

    if (normalized.startsWith("<:deadly:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.deadly,
        alt: "Deadly",
      };
    }

    if (normalized.startsWith("<:special:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.special,
        alt: "Special",
      };
    }

    if (normalized.startsWith("<:freeze:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.freeze,
        alt: "Freeze",
      };
    }

    if (normalized.startsWith("<:bullseye:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.bullseye,
        alt: "Bullseye",
      };
    }

    if (normalized.startsWith("<:frenzy:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.frenzy,
        alt: "Frenzy",
      };
    }

    if (normalized.startsWith("<:armored:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.armored,
        alt: "Armored",
      };
    }

    if (normalized.startsWith("<:overshoot:")) {
      return {
        url: MANUAL_STAT_IMAGE_LINKS.overshoot,
        alt: "Overshoot",
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

    /*
     * Supports:
     *
     * Antihero
     * Anti-Hero
     * Anti Hero
     * Strikethrough
     * Deadly
     * Bullseye
     * Frenzy
     * Armored
     * Overshoot
     * Special
     * Freeze
     *
     * Optional numeric modifiers are also supported:
     *
     * Armored 1
     * Overshoot 2
     * Anti-Hero 3
     */

    const traitPattern =
      /(anti[-\s]?hero|strikethrough|deadly|bullseye|frenzy|armored|overshoot|special|freeze)(?:\s+\*+\d+|\s+\d+)?/gi;

    const matches = [...String(text).matchAll(traitPattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const matchText = match[0];

      const traitName = match[1].toLowerCase().replace(/[\s-]/g, "");

      if (match.index > lastIndex) {
        parts.push(
          <span key={`trait-text-${index}`}>
            {text.slice(lastIndex, match.index)}
          </span>,
        );
      }

      let iconUrl = "";
      let iconAlt = "";

      if (traitName === "antihero") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.antihero;
        iconAlt = "Anti-Hero";
      } else if (traitName === "strikethrough") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.strikethrough;
        iconAlt = "Strikethrough";
      } else if (traitName === "deadly") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.deadly;
        iconAlt = "Deadly";
      } else if (traitName === "bullseye") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.bullseye;
        iconAlt = "Bullseye";
      } else if (traitName === "frenzy") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.frenzy;
        iconAlt = "Frenzy";
      } else if (traitName === "armored") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.armored;
        iconAlt = "Armored";
      } else if (traitName === "overshoot") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.overshoot;
        iconAlt = "Overshoot";
      } else if (traitName === "special") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.special;
        iconAlt = "Special";
      } else if (traitName === "freeze") {
        iconUrl = MANUAL_STAT_IMAGE_LINKS.freeze;
        iconAlt = "Freeze";
      }

      if (iconUrl) {
        parts.push(
          <span className="trait-with-icon" key={`trait-${index}`}>
            <img className="trait-icon" src={iconUrl} alt={iconAlt} />

            <span>{matchText}</span>
          </span>,
        );
      } else {
        parts.push(<span key={`trait-${index}`}>{matchText}</span>);
      }

      lastIndex = match.index + matchText.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="trait-text-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="card-overlay" onClick={close}>
      <div className="card-modal" onClick={(event) => event.stopPropagation()}>
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
    </div>
  );
}

export default CardModal;
