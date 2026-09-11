import {
  renderTitleText,
  renderStatsText,
  renderTraitText,
} from "../../utils/cardInfo/renderUtils.jsx";

import { getHeroColors } from "../../utils/heroInfo/heroUtils.js";

function HeroCard({
  hero,
  allCards,
  getSuperpowerCards,
  getRarityName,
  onOpenHero,
  onOpenSuperpower,
}) {
  const superpowers = getSuperpowerCards(hero, allCards);

  const [heroColor1, heroColor2] = getHeroColors(hero);

  const handleHeroKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenHero(hero);
    }
  };

  return (
    <div
      className="card-item hero-colored-card"
      style={{
        "--hero-color-1": heroColor1,
        "--hero-color-2": heroColor2,
      }}
      role="button"
      tabIndex={0}
      onClick={() => onOpenHero(hero)}
      onKeyDown={handleHeroKeyDown}
    >
      <div className="card-item-media">
        <img
          src={hero.thumbnail}
          alt={hero.card_name || "Hero"}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="card-item-info">
        <h2 className="card-item-title">
          {hero.title
            ? renderTitleText(hero.title)
            : hero.card_name || "Unknown Hero"}
        </h2>

        {hero.card_type && (
          <p>
            <span>Class:</span> {renderTitleText(hero.card_type)}
          </p>
        )}

        {hero.traits && (
          <p className="card-traits-line">
            <span className="card-field-label">Traits:</span>{" "}
            {renderTraitText(hero.traits)}
          </p>
        )}

        {hero.stats && (
          <p className="card-stats-line">
            <span className="card-field-label">Stats:</span>{" "}
            {renderStatsText(hero.stats)}
          </p>
        )}

        {hero.set_rarity && (
          <p>
            <span>Rarity:</span> {getRarityName(hero.set_rarity)}
          </p>
        )}

        {superpowers.length > 0 && (
          <div className="card-superpowers">
            <span className="card-field-label">Superpowers:</span>

            <div className="card-superpowers-grid">
              {superpowers.map((superpower) => (
                <button
                  key={superpower.cardid}
                  type="button"
                  className="card-superpower-button"
                  title={superpower.card_name}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenSuperpower(superpower);
                  }}
                >
                  <img
                    src={superpower.thumbnail}
                    alt={superpower.card_name}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeroCard;