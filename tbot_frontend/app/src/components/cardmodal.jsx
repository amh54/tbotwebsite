import { useState } from "react";
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
  sneaky: "https://i.ibb.co/nqFdR6HJ/Pv-ZH-Sneaky-Icon.png", 
}; 
 
const normalizeText = (value) => 
  String(value ?? "") 
    .trim() 
    .toLowerCase() 
    .replace(/\s+/g, " "); 
 
const removeDiscordEmojis = (value) => 
  String(value ?? "").replace(/<a?:[^:>]+:\d+>/gi, ""); 
 
const normalizeTraitName = (trait) => { 
  const value = removeDiscordEmojis(trait) 
    .replace(/[_~`]/g, "") 
    .replace(/\s+/g, " ") 
    .trim(); 
 
  const normalized = normalizeText(value); 
 
  const canonicalTraits = { 
    "anti hero": "Anti-Hero", 
    "anti-hero": "Anti-Hero", 
    antihero: "Anti-Hero", 
 
    armored: "Armored", 
    armour: "Armored", 
 
    "splash damage": "Splash Damage", 
    "splash-damage": "Splash Damage", 
    splashdamage: "Splash Damage", 
 
    bullseye: "Bullseye", 
    deadly: "Deadly", 
    freeze: "Freeze", 
    frenzy: "Frenzy", 
 
    "double strike": "Double Strike", 
    "double-strike": "Double Strike", 
    doublestrike: "Double Strike", 
 
    overshoot: "Overshoot", 
    special: "Special", 
 
    strikethrough: "Strikethrough", 
    "strike through": "Strikethrough", 
 
    untrickable: "Untrickable", 
  }; 
 
  const numberedMatch = normalized.match(/^(.+?)\s+(\d+)$/); 
 
  if (numberedMatch) { 
    const baseTrait = numberedMatch[1]; 
    const number = numberedMatch[2]; 
 
    return `${canonicalTraits[baseTrait] || baseTrait} ${number}`; 
  } 
 
  return canonicalTraits[normalized] || value; 
}; 
 
const getTraitNames = (traits) => { 
  if (!traits) { 
    return []; 
  } 
 
  return [ 
    ...new Set( 
      String(traits) 
        .split(/[,|;]/) 
        .map((trait) => normalizeTraitName(trait)) 
        .filter(Boolean), 
    ), 
  ]; 
}; 
const classNamesMatchTitle = (cardType, title) => { 
  if (!cardType || !title) { 
    return false; 
  } 
 
  const classNames = { 
    guardian: "guardian", 
    kabloom: "kabloom", 
    megagrow: "mega-grow", 
    smarty: "smarty", 
    solar: "solar", 
    beastly: "beastly", 
    brainy: "brainy", 
    crazy: "crazy", 
    hearty: "hearty", 
    sneaky: "sneaky", 
  }; 
 
  const titleText = String(title).toLowerCase(); 
  const typeText = String(cardType).toLowerCase(); 
 
  return Object.values(classNames).some( 
    (name) => 
      typeText.includes(name) && titleText.includes(name.replace("-", "")), 
  ); 
}; 
 
function CardModal({ card, close }) { 
  const hasValue = (value) => 
    value !== null && value !== undefined && String(value).trim() !== ""; 
  const [copied, setCopied] = useState(false); 
 
  const handleShare = async () => { 
    const url = new URL(window.location.href); 
 
    if (card?.card_name) { 
      url.searchParams.set("card", card.card_name); 
    } 
 
    try { 
      await navigator.clipboard.writeText(url.toString()); 
      setCopied(true); 
      window.setTimeout(() => setCopied(false), 2000); 
    } catch (err) { 
      console.error("Failed to copy card link", err); 
    } 
  }; 
  const getEmojiIcon = (emoji) => { 
    const match = String(emoji || "").match(/^<:([^:>]+):\d+>$/); 
 
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
 
  const getTraitIcon = (trait) => { 
    const baseTrait = String(trait) 
      .replace(/\s+\d+$/, "") 
      .trim(); 
 
    const iconMap = { 
      "Anti-Hero": { 
        url: MANUAL_STAT_IMAGE_LINKS.antihero, 
        alt: "Anti-Hero", 
      }, 
 
      Strikethrough: { 
        url: MANUAL_STAT_IMAGE_LINKS.strikethrough, 
        alt: "Strikethrough", 
      }, 
 
      Deadly: { 
        url: MANUAL_STAT_IMAGE_LINKS.deadly, 
        alt: "Deadly", 
      }, 
 
      Special: { 
        url: MANUAL_STAT_IMAGE_LINKS.special, 
        alt: "Special", 
      }, 
 
      Freeze: { 
        url: MANUAL_STAT_IMAGE_LINKS.freeze, 
        alt: "Freeze", 
      }, 
 
      Bullseye: { 
        url: MANUAL_STAT_IMAGE_LINKS.bullseye, 
        alt: "Bullseye", 
      }, 
 
      Frenzy: { 
        url: MANUAL_STAT_IMAGE_LINKS.frenzy, 
        alt: "Frenzy", 
      }, 
 
      Armored: { 
        url: MANUAL_STAT_IMAGE_LINKS.armored, 
        alt: "Armored", 
      }, 
 
      Overshoot: { 
        url: MANUAL_STAT_IMAGE_LINKS.overshoot, 
        alt: "Overshoot", 
      }, 
 
      Untrickable: { 
        url: MANUAL_STAT_IMAGE_LINKS.untrickable, 
        alt: "Untrickable", 
      }, 
 
      "Double Strike": { 
        url: MANUAL_STAT_IMAGE_LINKS.doublestrike, 
        alt: "Double Strike", 
      }, 
 
      "Splash Damage": null, 
    }; 
 
    return iconMap[baseTrait] || null; 
  }; 
 
  const renderTitleText = (title) => { 
    if (!title) { 
      return null; 
    } 
 
    const text = String(title).replace(/\*\*/g, "").replace(/__/g, "").trim(); 
 
    const emojiPattern = /<:([^:>]+):\d+>/gi; 
    const matches = [...text.matchAll(emojiPattern)]; 
 
    const classNameMap = { 
      guardian: "Guardian", 
      kabloom: "Kabloom", 
      megagrow: "Mega-Grow", 
      smarty: "Smarty", 
      solar: "Solar", 
      beastly: "Beastly", 
      brainy: "Brainy", 
      crazy: "Crazy", 
      hearty: "Hearty", 
      sneaky: "Sneaky", 
    }; 
 
    const titleParts = []; 
    const classIcons = []; 
    const classNames = []; 
 
    let lastIndex = 0; 
 
    matches.forEach((match, index) => { 
      const fullMatch = match[0]; 
      const emojiName = match[1]; 
      const matchIndex = match.index; 
 
      if (matchIndex > lastIndex) { 
        titleParts.push( 
          <span key={`title-text-${index}`}> 
            {text.slice(lastIndex, matchIndex)} 
          </span>, 
        ); 
      } 
 
      const icon = getEmojiIcon(fullMatch); 
 
      if (icon?.url) { 
        classIcons.push( 
          <img 
            key={`title-icon-${index}`} 
            src={icon.url} 
            alt={icon.alt} 
            className="card-modal-title-class-icon" 
          />, 
        ); 
      } 
 
      const normalizedName = emojiName.toLowerCase().replace(/[-_\s]/g, ""); 
 
      if (classNameMap[normalizedName]) { 
        classNames.push(classNameMap[normalizedName]); 
      } 
 
      lastIndex = matchIndex + fullMatch.length; 
    }); 
 
    if (lastIndex < text.length) { 
      titleParts.push(<span key="title-end">{text.slice(lastIndex)}</span>); 
    } 
 
    return ( 
      <div className="card-modal-title-content"> 
        <div className="card-modal-title-name-row"> 
          <span className="card-modal-title-name">{titleParts}</span> 
 
          <span className="card-modal-title-icons">{classIcons}</span> 
        </div> 
 
        {classNames.length > 0 && ( 
          <span className="card-modal-title-class-circle"> 
            {classNames.join(", ")} 
          </span> 
        )} 
      </div> 
    ); 
  }; 
 
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
            className="ability-stat-icon" 
          />, 
        ); 
      } else { 
        const emojiName = fullEmoji.replace(/^<:([^:>]+):\d+>$/, "$1"); 
 
        parts.push(<span key={`stats-unknown-${index}`}>{emojiName}</span>); 
      } 
 
      lastIndex = matchIndex + fullEmoji.length; 
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
 
        if (icon?.url) { 
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
 
    if (lastIndex < text.length) { 
      parts.push( 
        <span key="ability-text-end"> 
          {text.slice(lastIndex).replace(/<:([^:>]+):\d+>/gi, "$1")} 
        </span>, 
      ); 
    } 
 
    return parts; 
  }; 
 
  const renderTraitText = (text) => { 
    const traitNames = getTraitNames(text); 
 
    if (traitNames.length === 0) { 
      return null; 
    } 
 
    return ( 
      <span className="trait-rendered"> 
        {traitNames.map((trait, index) => { 
          const icon = getTraitIcon(trait); 
 
          return ( 
            <span key={`${trait}-${index}`} className="trait-rendered-item"> 
              {icon?.url && ( 
                <img src={icon.url} alt={icon.alt} className="trait-icon" /> 
              )} 
 
              <u>{trait}</u> 
 
              {index < traitNames.length - 1 && ", "} 
            </span> 
          ); 
        })} 
      </span> 
    ); 
  }; 
 
  const renderTribeText = (text) => { 
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
        return <strong key={`tribe-${index}`}>{segment}</strong>; 
      } 
 
      return <span key={`tribe-${index}`}>{segment}</span>; 
    }); 
  }; 
 
  if (!card) { 
    return null; 
  } 
 
  return ( 
    <div className="card-modal-overlay" onClick={close} role="presentation"> 
      <div 
        className="card-modal" 
        onClick={(event) => event.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-label={card.card_name || "Card information"} 
      > 
        <button 
          type="button" 
          className="card-modal-close" 
          onClick={close} 
          aria-label="Close card information" 
        > 
          × 
        </button> 
 
        <div className="card-modal-image-section"> 
          <img 
            className="modal-card-image" 
            src={card.thumbnail} 
            alt={card.card_name || "Card"} 
          /> 
 
          <div className="card-modal-actions"> 
            <button 
              type="button" 
              className="share-card-btn" 
              onClick={handleShare} 
            > 
              {copied ? "Link Copied!" : "Share Card"} 
            </button> 
          </div> 
        </div> 
 
        <div className="modal-info"> 
          <div className="modal-header"> 
            <h2 className="modal-title"> 
              {hasValue(card.title) 
                ? renderTitleText(card.title) 
                : card.card_name} 
            </h2> 
 
            {hasValue(card.card_type) && 
              !classNamesMatchTitle(card.card_type, card.title) && ( 
                <span className="card-type">{card.card_type}</span> 
              )} 
          </div> 
 
          {(hasValue(card.description) || hasValue(card.stats)) && ( 
            <div className="modal-top-row"> 
              {hasValue(card.description) && ( 
                <section className="modal-section description-section"> 
                  <h3 className="label">Tribe</h3> 
 
                  <p className="description-text"> 
                    {renderTribeText(card.description)} 
                  </p> 
                </section> 
              )} 
 
              {hasValue(card.stats) && ( 
                <section className="modal-section stats-section"> 
                  <h3 className="label">Stats</h3> 
 
                  <p className="value stats-value"> 
                    {renderStatsText(card.stats)} 
                  </p> 
                </section> 
              )} 
            </div> 
          )} 
 
          <section className="modal-metadata"> 
            {hasValue(card.ability) && ( 
              <div className="metadata-item"> 
                <span className="label">Abilities</span> 
 
                <span className="value ability-value"> 
                  {renderAbilityText(card.ability)} 
                </span> 
              </div> 
            )} 
 
            {hasValue(card.traits) && ( 
              <div className="metadata-item trait-item"> 
                <span className="label">Traits</span> 
 
                <span className="value trait-value"> 
                  {renderTraitText(card.traits)} 
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