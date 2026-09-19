import Select from "react-select";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#202020",
    borderColor: state.isFocused ? "#8fe38b" : "#444",
    minHeight: "45px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#8fe38b",
    },
  }),

  valueContainer: (base) => ({
    ...base,
    minWidth: 0,
    flexWrap: "wrap",
    maxHeight: "140px",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  }),

  indicatorsContainer: (base) => ({
    ...base,
    alignSelf: "flex-start",
    flexShrink: 0,
  }),

  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#202020",
  }),

  menuList: (base) => ({
    ...base,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#333" : "#202020",
    color: "white",
    cursor: "pointer",
  }),

  multiValue: (base) => ({
    ...base,
    backgroundColor: "#333",
    maxWidth: "100%",
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "white",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),

  multiValueRemove: (base) => ({
    ...base,
    color: "#aaa",
    "&:hover": {
      backgroundColor: "#555",
      color: "white",
    },
  }),

  singleValue: (base) => ({
    ...base,
    color: "white",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#888",
  }),

  input: (base) => ({
    ...base,
    color: "white",
  }),
};

const FilterSelect = ({ placeholder, options, value, onChange }) => {
  return (
    <div className="card-select-wrapper">
      <Select
        styles={selectStyles}
        menuPortalTarget={document.body}
        placeholder={placeholder}
        options={options}
        value={value}
        onChange={onChange}
        isMulti
        closeMenuOnSelect={false}
      />
    </div>
  );
};

const CardManagerFilters = ({
  search,
  onSearchChange,
  side,
  type,
  cardClass,
  cost,
  set,
  rarity,
  sideOptions,
  typeOptions,
  classOptions,
  costOptions,
  setOptions,
  rarityOptions,
  onSideChange,
  onTypeChange,
  onClassChange,
  onCostChange,
  onSetChange,
  onRarityChange,
  onClear,
}) => {
  return (
    <>
      <div className="card-search-container">
        <input
          className="card-search"
          placeholder="Search your collection..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="card-filters-actions">
        <button
          type="button"
          className="clear-card-filter-btn"
          onClick={onClear}
        >
          Clear
        </button>
      </div>

      <div className="card-filters">
        <FilterSelect
          placeholder="Side"
          options={sideOptions}
          value={side}
          onChange={onSideChange}
        />

        <FilterSelect
          placeholder="Type"
          options={typeOptions}
          value={type}
          onChange={onTypeChange}
        />

        <FilterSelect
          placeholder="Class"
          options={classOptions}
          value={cardClass}
          onChange={onClassChange}
        />

        <FilterSelect
          placeholder="Cost"
          options={costOptions}
          value={cost}
          onChange={onCostChange}
        />

        <FilterSelect
          placeholder="Set"
          options={setOptions}
          value={set}
          onChange={onSetChange}
        />

        <FilterSelect
          placeholder="Rarity"
          options={rarityOptions}
          value={rarity}
          onChange={onRarityChange}
        />
      </div>
    </>
  );
};

export default CardManagerFilters;
