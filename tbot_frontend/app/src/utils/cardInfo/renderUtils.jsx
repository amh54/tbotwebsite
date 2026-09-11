import { CLASS_ICON_LINKS, STAT_ICON_LINKS, TRAIT_ICON_LINKS } from "./iconLinks.js";
import { getTraitNames } from "./dataUtils.js";

export const getEmojiIcon = (emoji) => {
  const match = String(emoji || "").match(/^<:([^:>]+):\d+>$/);

  if (!match) {
    return null;
  }

  const emojiName = match[1].toLowerCase().replace(/[-_\s]/g, "");

  const iconMap = {
    brainz: {
      url: STAT_ICON_LINKS.cost,
      alt: "Brainz",
    },
    strength: {
      url: STAT_ICON_LINKS.strength,
      alt: "Strength",
    },
    health: {
      url: STAT_ICON_LINKS.health,
      alt: "Health",
    },
    sun: {
      url: STAT_ICON_LINKS.sun,
      alt: "Sun",
    },
    healthstrength: {
      url: STAT_ICON_LINKS.healthstrength,
      alt: "Health and Strength",
    },
    deadly: {
      url: TRAIT_ICON_LINKS.deadly,
      alt: "Deadly",
    },
    freeze: {
      url: TRAIT_ICON_LINKS.freeze,
      alt: "Freeze",
    },
    antihero: {
      url: TRAIT_ICON_LINKS.antihero,
      alt: "Anti-Hero",
    },
    strikethrough: {
      url: TRAIT_ICON_LINKS.strikethrough,
      alt: "Strikethrough",
    },
    special: {
      url: TRAIT_ICON_LINKS.special,
      alt: "Special",
    },
    bullseye: {
      url: TRAIT_ICON_LINKS.bullseye,
      alt: "Bullseye",
    },
    frenzy: {
      url: TRAIT_ICON_LINKS.frenzy,
      alt: "Frenzy",
    },
    armored: {
      url: TRAIT_ICON_LINKS.armored,
      alt: "Armored",
    },
    overshoot: {
      url: TRAIT_ICON_LINKS.overshoot,
      alt: "Overshoot",
    },
    untrickable: {
      url: TRAIT_ICON_LINKS.untrickable,
      alt: "Untrickable",
    },
    doublestrike: {
      url: TRAIT_ICON_LINKS.doublestrike,
      alt: "Double Strike",
    },
    splashdamage: {
      url: TRAIT_ICON_LINKS.splashdamage,
      alt: "Splash Damage",
    },
    guardian: {
      url: CLASS_ICON_LINKS.guardian,
      alt: "Guardian",
    },
    kabloom: {
      url: CLASS_ICON_LINKS.kabloom,
      alt: "Kabloom",
    },
    megagrow: {
      url: CLASS_ICON_LINKS.megagrow,
      alt: "Mega-Grow",
    },
    smarty: {
      url: CLASS_ICON_LINKS.smarty,
      alt: "Smarty",
    },
    solar: {
      url: CLASS_ICON_LINKS.solar,
      alt: "Solar",
    },
    beastly: {
      url: CLASS_ICON_LINKS.beastly,
      alt: "Beastly",
    },
    brainy: {
      url: CLASS_ICON_LINKS.brainy,
      alt: "Brainy",
    },
    crazy: {
      url: CLASS_ICON_LINKS.crazy,
      alt: "Crazy",
    },
    hearty: {
      url: CLASS_ICON_LINKS.hearty,
      alt: "Hearty",
    },
    sneaky: {
      url: CLASS_ICON_LINKS.sneaky,
      alt: "Sneaky",
    },
  };

  return iconMap[emojiName] || null;
};

// `side` ("Plants" | "Zombies") decides whether the cost filter shows the
// sun or brainz icon, so it's passed in explicitly rather than read from a
// component closure.
export const getFilterIcon = (type, side) => {
  let icon = null;

  if (type === "cost") {
    icon =
      side === "Plants"
        ? {
            url: STAT_ICON_LINKS.sun,
            alt: "Sun",
          }
        : {
            url: STAT_ICON_LINKS.cost,
            alt: "Brainz",
          };
  }

  if (type === "attack") {
    icon = {
      url: STAT_ICON_LINKS.strength,
      alt: "Strength",
    };
  }

  if (type === "health") {
    icon = {
      url: STAT_ICON_LINKS.health,
      alt: "Health",
    };
  }

  if (!icon?.url) {
    return null;
  }

  return (
    <img
      src={icon.url}
      alt={icon.alt}
      className="card-filter-icon"
      loading="lazy"
      decoding="async"
    />
  );
};

export const renderFilterLabel = (text, iconType = null, side) => {
  return (
    <span className="card-filter-option-label">
      <span>{text}</span>
      {iconType && getFilterIcon(iconType, side)}
    </span>
  );
};

export const renderTitleText = (title) => {
  if (!title) {
    return null;
  }

  const text = String(title);
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

    if (icon?.url) {
      parts.push(
        <img
          key={`title-icon-${index}`}
          src={icon.url}
          alt={icon.alt}
          className="card-stat-icon"
          loading="lazy"
          decoding="async"
        />,
      );
    }

    lastIndex = matchIndex + fullMatch.length;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="title-end">{text.slice(lastIndex)}</span>);
  }

  return <span className="card-title-content">{parts}</span>;
};

export const renderStatsText = (stats) => {
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
    const fullEmoji = match[1];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(
        <span key={`stats-text-${index}`}>
          {text.slice(lastIndex, matchIndex)}
        </span>,
      );
    }

    const icon = getEmojiIcon(fullEmoji);

    if (icon?.url) {
      parts.push(
        <img
          key={`stats-icon-${index}`}
          src={icon.url}
          alt={icon.alt}
          className="card-stat-icon"
        />,
      );
    }

    lastIndex = matchIndex + fullEmoji.length;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="stats-end">{text.slice(lastIndex)}</span>);
  }

  return parts;
};

export const renderTraitText = (text) => {
  if (!text) {
    return null;
  }

  const rawText = String(text);
  const pattern = /(<:[^:>]+:\d+>)/gi;
  const matches = [...rawText.matchAll(pattern)];

  if (matches.length === 0) {
    const traitNames = getTraitNames(rawText);

    return (
      <span className="trait-rendered">
        {traitNames.map((trait, index) => (
          <span key={`${trait}-${index}`} className="trait-rendered-item">
            <u>{trait}</u>
            {index < traitNames.length - 1 && ", "}
          </span>
        ))}
      </span>
    );
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const fullEmoji = match[1];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      const textBeforeIcon = rawText
        .slice(lastIndex, matchIndex)
        .replace(/\*\*/g, "")
        .replace(/\_\_/g, "")
        .trim();

      if (textBeforeIcon) {
        parts.push(
          <span key={`trait-text-${index}`}>
            <u>{textBeforeIcon}</u>
          </span>,
        );
      }
    }

    const icon = getEmojiIcon(fullEmoji);

    if (icon?.url) {
      parts.push(
        <img
          key={`trait-icon-${index}`}
          src={icon.url}
          alt={icon.alt}
          className="card-trait-icon"
        />,
      );
    }

    lastIndex = matchIndex + fullEmoji.length;
  });

  if (lastIndex < rawText.length) {
    const remainingText = rawText
      .slice(lastIndex)
      .replace(/\*\*/g, "")
      .replace(/\_\_/g, "")
      .trim();

    if (remainingText) {
      parts.push(
        <span key="trait-end">
          <u>{remainingText}</u>
        </span>,
      );
    }
  }

  return <span className="trait-rendered">{parts}</span>;
};

export const renderAbilityText = (text, maxLength = 177) => {
  if (!text) {
    return null;
  }

  let value = String(text);

  if (value.length > maxLength) {
    let cut = value.slice(0, maxLength);
    const lastEmojiStart = cut.lastIndexOf("<:");
    const lastEmojiEnd = cut.lastIndexOf(">");

    if (lastEmojiStart > lastEmojiEnd) {
      cut = cut.slice(0, lastEmojiStart);
    }

    value = `${cut.trimEnd()}…`;
  }

  const pattern =
    /(<:[^:>]+:\d+>)|(\*\*\_\_[\s\S]*?\_\_\*\*)|(\_\_\*\*[\s\S]*?\*\*\_\_)|(\*\*[\s\S]*?\*\*)|(\_\_[\s\S]*?\_\_)/gi;

  const matches = [...value.matchAll(pattern)];

  if (matches.length === 0) {
    return (
      <span>
        {value.replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
      </span>
    );
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const fullMatch = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      const normalText = value.slice(lastIndex, matchIndex);

      parts.push(
        <span key={`ability-text-${index}`}>
          {normalText.replace(
            /<:([^:>]+):\d+>/gi,
            (_, emojiName) => emojiName,
          )}
        </span>,
      );
    }

    if (match[1]) {
      const icon = getEmojiIcon(match[1]);

      if (icon?.url) {
        parts.push(
          <img
            key={`ability-icon-${index}`}
            src={icon.url}
            alt={icon.alt}
            className="card-ability-icon"
          />,
        );
      } else {
        const emojiName = match[1].replace(/^<:([^:>]+):\d+>$/, "$1");

        parts.push(<span key={`ability-unknown-${index}`}>{emojiName}</span>);
      }
    } else if (match[2]) {
      parts.push(
        <strong key={`bold-underline-${index}`}>
          <u>{match[2].slice(4, -4)}</u>
        </strong>,
      );
    } else if (match[3]) {
      parts.push(
        <strong key={`underline-bold-${index}`}>
          <u>{match[3].slice(4, -4)}</u>
        </strong>,
      );
    } else if (match[4]) {
      parts.push(
        <strong key={`bold-${index}`}>{match[4].slice(2, -2)}</strong>,
      );
    } else if (match[5]) {
      parts.push(<u key={`underline-${index}`}>{match[5].slice(2, -2)}</u>);
    }

    lastIndex = matchIndex + fullMatch.length;
  });

  if (lastIndex < value.length) {
    parts.push(
      <span key="ability-text-end">
        {value
          .slice(lastIndex)
          .replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
      </span>,
    );
  }

  return <span>{parts}</span>;
};