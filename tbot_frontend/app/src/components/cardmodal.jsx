import "../css/cardmodal.css";

const MANUAL_STAT_IMAGE_LINKS = {
  cost: "https://i.ibb.co/Q30j2CgC/brainz.webp",
  strength: "https://i.ibb.co/GQt785K6/strength.webp",
  health: "https://i.ibb.co/bMj86Wvg/health.webp",
  sun: "https://i.ibb.co/3mwp3d6s/sun.webp",
  healthstrength: "https://i.ibb.co/9344x8fP/healthstrength.webp",

  antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
  strikethrough: "https://i.ibb.co/99KG7vjj/strikethrough.webp",
  deadly: "https://i.ibb.co/xt6pkMT1/deadly.webp",
  special: "https://i.ibb.co/Sw0yS0Mg/special.webp",
  freeze: "https://i.ibb.co/hFPRcrp6/freeze.webp",

  bullseye: "https://i.ibb.co/tTp9zzdh/Bullseye.webp",
  frenzy: "https://i.ibb.co/0RC4sW0b/frenzy.webp",
  armored: "https://i.ibb.co/SXTYdVry/armored.webp",
  overshoot: "https://i.ibb.co/prbYt2DX/overshoot.webp",
  untrickable: "https://i.ibb.co/235QDZsg/untrickable.webp",
  doublestrike: "https://i.ibb.co/9HcptVCN/doublestrike.webp",

  guardian: "https://i.ibb.co/q339dYKK/guardian.webp",
  kabloom: "https://i.ibb.co/4gWkPT7f/kabloom.webp",
  megagrow: "https://i.ibb.co/svc6sx30/megagrow.webp",
  smarty: "https://i.ibb.co/V0bL3RYk/smarty.webp",
  solar: "https://i.ibb.co/YFMMD4DZ/solar.webp",
  beastly: "https://i.ibb.co/xS6b10P5/beastly.webp",
  brainy: "https://i.ibb.co/d40zFh8r/Brainy.webp",
  crazy: "https://i.ibb.co/HTvzSsXX/crazy.webp",
  hearty: "https://i.ibb.co/ynKbzV8v/hearty.webp",
  sneaky: "https://plantsvszombies.wiki.gg/images/PvZH_Sneaky_Icon.png?c6fd41=&format=original",
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
    const match = String(emoji || "").match(/^<:([^:]+):\d+>$/);

    if (!match) {
      return null;
    }

    const emojiName = match[1].toLowerCase().replace(/[-_\s]/g, "");

    const iconMap = {
      brainz: {
        url: MANUAL_STAT_IMAGE_LINKS.cost,
        alt: "Brainz",
      },

      strength: {
        url: MANUAL_STAT_IMAGE_LINKS.strength,
        alt: "Strength",
      },

      health: {
        url: MANUAL_STAT_IMAGE_LINKS.health,
        alt: "Health",
      },

      sun: {
        url: MANUAL_STAT_IMAGE_LINKS.sun,
        alt: "Sun",
      },

      healthstrength: {
        url: MANUAL_STAT_IMAGE_LINKS.healthstrength,
        alt: "Health and Strength",
      },

      antihero: {
        url: MANUAL_STAT_IMAGE_LINKS.antihero,
        alt: "Anti-Hero",
      },

      strikethrough: {
        url: MANUAL_STAT_IMAGE_LINKS.strikethrough,
        alt: "Strikethrough",
      },

      deadly: {
        url: MANUAL_STAT_IMAGE_LINKS.deadly,
        alt: "Deadly",
      },

      special: {
        url: MANUAL_STAT_IMAGE_LINKS.special,
        alt: "Special",
      },

      freeze: {
        url: MANUAL_STAT_IMAGE_LINKS.freeze,
        alt: "Freeze",
      },

      bullseye: {
        url: MANUAL_STAT_IMAGE_LINKS.bullseye,
        alt: "Bullseye",
      },

      frenzy: {
        url: MANUAL_STAT_IMAGE_LINKS.frenzy,
        alt: "Frenzy",
      },

      armored: {
        url: MANUAL_STAT_IMAGE_LINKS.armored,
        alt: "Armored",
      },

      overshoot: {
        url: MANUAL_STAT_IMAGE_LINKS.overshoot,
        alt: "Overshoot",
      },

      untrickable: {
        url: MANUAL_STAT_IMAGE_LINKS.untrickable,
        alt: "Untrickable",
      },

      doublestrike: {
        url: MANUAL_STAT_IMAGE_LINKS.doublestrike,
        alt: "Double Strike",
      },

      guardian: {
        url: MANUAL_STAT_IMAGE_LINKS.guardian,
        alt: "Guardian",
      },

      kabloom: {
        url: MANUAL_STAT_IMAGE_LINKS.kabloom,
        alt: "Kabloom",
      },

      megagrow: {
        url: MANUAL_STAT_IMAGE_LINKS.megagrow,
        alt: "Mega-Grow",
      },

      smarty: {
        url: MANUAL_STAT_IMAGE_LINKS.smarty,
        alt: "Smarty",
      },

      solar: {
        url: MANUAL_STAT_IMAGE_LINKS.solar,
        alt: "Solar",
      },

      beastly: {
        url: MANUAL_STAT_IMAGE_LINKS.beastly,
        alt: "Beastly",
      },

      brainy: {
        url: MANUAL_STAT_IMAGE_LINKS.brainy,
        alt: "Brainy",
      },

      crazy: {
        url: MANUAL_STAT_IMAGE_LINKS.crazy,
        alt: "Crazy",
      },

      hearty: {
        url: MANUAL_STAT_IMAGE_LINKS.hearty,
        alt: "Hearty",
      },

      sneaky: {
        url: MANUAL_STAT_IMAGE_LINKS.sneaky,
        alt: "Sneaky",
      },
    };

    return iconMap[emojiName] || null;
  };

  const renderTitleText = (title) => {
    if (!title) {
      return null;
    }

    const text = String(title).replace(/\*\*/g, "").replace(/__/g, "");

    const emojiPattern = /<:[^:>]+:\d+>/gi;
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
          <span key={`title-text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      const icon = getEmojiIcon(fullMatch);

      if (icon) {
        parts.push(
          <img
            key={`title-icon-${index}`}
            src={icon.url}
            alt={icon.alt}
            className="card-modal-title-class-icon"
          />,
        );
      } else {
        const emojiName = fullMatch.replace(/^<:([^:>]+):\d+>$/, "$1");

        parts.push(<span key={`title-unknown-${index}`}>{emojiName}</span>);
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="title-end">{text.slice(lastIndex)}</span>);
    }

    return <span className="card-modal-title-content">{parts}</span>;
  };

  const renderStatsText = (stats) => {
    if (!stats) {
      return null;
    }

    const text = String(stats);

    const emojiPattern = /<:[^:>]+:\d+>/gi;
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
        const emojiName = fullMatch.replace(/^<:([^:>]+):\d+>$/, "$1");

        parts.push(<span key={`stats-unknown-${index}`}>{emojiName}</span>);
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
      return <span>{text.replace(/<:([^:>]+):\d+>/gi, "$1")}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const normalText = text.slice(lastIndex, matchIndex);

        parts.push(
          <span key={`ability-text-${index}`}>
            {normalText.replace(/<:([^:>]+):\d+>/gi, "$1")}
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
          const emojiName = match[1].replace(/^<:([^:>]+):\d+>$/, "$1");

          parts.push(<span key={`ability-unknown-${index}`}>{emojiName}</span>);
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
      const remainingText = text.slice(lastIndex);

      parts.push(
        <span key="ability-text-end">
          {remainingText.replace(/<:([^:>]+):\d+>/gi, "$1")}
        </span>,
      );
    }

    return parts;
  };

  const renderTraitText = (text) => {
    if (!text) {
      return null;
    }

    const value = String(text);

    const emojiPattern = /<:[^:>]+:\d+>/gi;
    const emojiMatches = [...value.matchAll(emojiPattern)];

    if (emojiMatches.length > 0) {
      const parts = [];
      let lastIndex = 0;

      emojiMatches.forEach((match, index) => {
        const fullMatch = match[0];
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
          const normalText = value.slice(lastIndex, matchIndex);

          parts.push(
            <span key={`trait-text-${index}`}>
              {normalText.replace(/__/g, "").replace(/\*\*/g, "")}
            </span>,
          );
        }

        const icon = getEmojiIcon(fullMatch);

        if (icon) {
          parts.push(
            <img
              key={`trait-icon-${index}`}
              className="trait-icon"
              src={icon.url}
              alt={icon.alt}
            />,
          );
        } else {
          const emojiName = fullMatch.replace(/^<:([^:>]+):\d+>$/, "$1");

          parts.push(<span key={`trait-unknown-${index}`}>{emojiName}</span>);
        }

        lastIndex = matchIndex + fullMatch.length;
      });

      if (lastIndex < value.length) {
        const remaining = value.slice(lastIndex);

        const cleaned = remaining.replace(/__/g, "").replace(/\*\*/g, "");

        if (cleaned) {
          parts.push(<span key="trait-end">{cleaned}</span>);
        }
      }

      return <span className="trait-rendered">{parts}</span>;
    }

    const traitPattern =
      /(anti[-\s]?hero|strikethrough|deadly|bullseye|frenzy|armored|overshoot|untrickable|doublestrike|freeze|special)/gi;

    const matches = [...value.matchAll(traitPattern)];

    if (matches.length === 0) {
      return <span>{value}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    const iconMap = {
      antihero: [MANUAL_STAT_IMAGE_LINKS.antihero, "Anti-Hero"],
      strikethrough: [MANUAL_STAT_IMAGE_LINKS.strikethrough, "Strikethrough"],
      deadly: [MANUAL_STAT_IMAGE_LINKS.deadly, "Deadly"],
      bullseye: [MANUAL_STAT_IMAGE_LINKS.bullseye, "Bullseye"],
      frenzy: [MANUAL_STAT_IMAGE_LINKS.frenzy, "Frenzy"],
      armored: [MANUAL_STAT_IMAGE_LINKS.armored, "Armored"],
      overshoot: [MANUAL_STAT_IMAGE_LINKS.overshoot, "Overshoot"],
      untrickable: [MANUAL_STAT_IMAGE_LINKS.untrickable, "Untrickable"],
      doublestrike: [MANUAL_STAT_IMAGE_LINKS.doublestrike, "Double Strike"],
      freeze: [MANUAL_STAT_IMAGE_LINKS.freeze, "Freeze"],
      special: [MANUAL_STAT_IMAGE_LINKS.special, "Special"],
    };

    matches.forEach((match, index) => {
      const matchText = match[0];
      const traitName = match[1].toLowerCase().replace(/[-\s]/g, "");

      if (match.index > lastIndex) {
        parts.push(
          <span key={`trait-text-${index}`}>
            {value.slice(lastIndex, match.index)}
          </span>,
        );
      }

      const icon = iconMap[traitName];

      if (icon) {
        parts.push(
          <span className="trait-with-icon" key={`trait-${index}`}>
            <img className="trait-icon" src={icon[0]} alt={icon[1]} />

            <span className="trait-name">{matchText}</span>
          </span>,
        );
      } else {
        parts.push(<span key={`trait-${index}`}>{matchText}</span>);
      }

      lastIndex = match.index + matchText.length;
    });

    if (lastIndex < value.length) {
      parts.push(<span key="trait-text-end">{value.slice(lastIndex)}</span>);
    }

    return <span className="trait-rendered">{parts}</span>;
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
            <h2 className="modal-title">
              {hasValue(card.title)
                ? renderTitleText(card.title)
                : card.card_name}
            </h2>

            {hasValue(card.card_type) && (
              <span className="card-type">{card.card_type}</span>
            )}
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
