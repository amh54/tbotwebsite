import { useEffect, useRef, useState } from "react";

import "../css/filterdropdown.css";

function FilterDropdown({
  label,
  options = [],
  value = [],
  onChange,
  multi = true,

  // Optional authentication gate
  requiresAuth = false,
  isAuthenticated = true,
  authMessage = "",
  onAuthRequired,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedValues = Array.isArray(value) ? value : [];

  const hasSelection = multi ? selectedValues.length > 0 : Boolean(value);

  const isSelected = (option) => {
    if (multi) {
      return selectedValues.some((selected) => selected.value === option.value);
    }

    return value?.value === option.value;
  };

  const handleSelect = (option) => {
    if (multi) {
      const exists = selectedValues.some(
        (selected) => selected.value === option.value,
      );

      if (exists) {
        onChange(
          selectedValues.filter((selected) => selected.value !== option.value),
        );
      } else {
        onChange([...selectedValues, option]);
      }

      setOpen(true);
      return;
    }

    onChange(isSelected(option) ? null : option);
    setOpen(false);
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();

    onChange(multi ? [] : null);
  };

  const handleTriggerClick = () => {
    // Authentication-gated dropdown
    if (requiresAuth && !isAuthenticated) {
      setOpen(false);

      if (onAuthRequired) {
        onAuthRequired();
      }

      return;
    }

    setOpen((current) => !current);
  };

  const triggerLabel = multi
    ? selectedValues.length > 0
      ? selectedValues.map((item) => item.label).join(", ")
      : label
    : value?.label || label;

  return (
    <div className={`filter-dropdown ${open ? "is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className={`filter-dropdown-trigger ${open ? "open" : ""}`}
        onClick={handleTriggerClick}
        aria-expanded={open}
      >
        <span className="filter-dropdown-trigger-label">{triggerLabel}</span>

        {hasSelection ? (
          <span
            className="filter-dropdown-clear"
            onClick={handleClear}
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label} filter`}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleClear(event);
              }
            }}
          >
            ×
          </span>
        ) : (
          <span className="filter-dropdown-arrow" aria-hidden="true">
            ▾
          </span>
        )}
      </button>

      {open && (
        <div
          className="filter-dropdown-menu"
          onClick={(event) => event.stopPropagation()}
        >
          {options.length === 0 ? (
            <div className="filter-dropdown-empty">No options available</div>
          ) : (
            options.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`filter-dropdown-item ${
                  isSelected(option) ? "selected" : ""
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.icon && (
                  <span className="filter-item-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                )}

                {option.image && (
                  <img
                    src={option.image}
                    alt=""
                    className="filter-item-image"
                  />
                )}

                <div className="filter-item-text">
                  <div className="filter-item-title">
                    {option.label}
                    {typeof option.count === "number" && ` (${option.count})`}
                  </div>

                  {option.description && (
                    <div className="filter-item-description">
                      {option.description}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
