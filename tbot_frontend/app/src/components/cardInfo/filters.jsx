import Select from "react-select";

import { selectStyles } from "../../utils/cardInfo/selectStyles.js";

function Filters({
  side,
  changeSide,
  search,
  setSearch,
  clearFilters,
  costOptions,
  costFilter,
  setCostFilter,
  attackOptions,
  attackFilter,
  setAttackFilter,
  healthOptions,
  healthFilter,
  setHealthFilter,
  classOptions,
  classFilter,
  setClassFilter,
  tribeOptions,
  tribeFilter,
  setTribeFilter,
  rarityOptions,
  rarityFilter,
  setRarityFilter,
  setOptions,
  setFilter,
  setSetFilter,
  typeOptions,
  typeFilter,
  setTypeFilter,
  keywordOptions,
  keywordFilter,
  setKeywordFilter,
}) {
  return (
    <div className="card-browser">
      <div className="card-side-tabs">
        <button
          type="button"
          className={side === "Plants" ? "active" : ""}
          onClick={() => changeSide("Plants")}
        >
          Plants
        </button>

        <button
          type="button"
          className={side === "Zombies" ? "active" : ""}
          onClick={() => changeSide("Zombies")}
        >
          Zombies
        </button>
      </div>

      <div className="card-search-container">
        <input
          className="card-search"
          placeholder="Search cards, abilities, traits, aliases..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="card-filters-actions">
        <button
          type="button"
          className="clear-card-filter-btn"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      <div className="card-filters">
        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Cost"
            options={costOptions}
            value={costFilter}
            onChange={setCostFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Attack"
            options={attackOptions}
            value={attackFilter}
            onChange={setAttackFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Health"
            options={healthOptions}
            value={healthFilter}
            onChange={setHealthFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Class"
            options={classOptions}
            value={classFilter}
            onChange={setClassFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Tribe"
            options={tribeOptions}
            value={tribeFilter}
            onChange={setTribeFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Rarity"
            options={rarityOptions}
            value={rarityFilter}
            onChange={setRarityFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Set"
            options={setOptions}
            value={setFilter}
            onChange={setSetFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Types"
            options={typeOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>

        <div className="card-select-wrapper">
          <Select
            styles={selectStyles}
            menuPortalTarget={document.body}
            placeholder="Keywords"
            options={keywordOptions}
            value={keywordFilter}
            onChange={setKeywordFilter}
            isMulti
            closeMenuOnSelect={false}
          />
        </div>
      </div>
    </div>
  );
}

export default Filters;