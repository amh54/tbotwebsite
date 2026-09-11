export const selectStyles = {
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
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "white",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#aaa",
    ":hover": {
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