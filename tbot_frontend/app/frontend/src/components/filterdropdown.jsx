import { useState, useRef, useEffect } from "react";
import "../css/filterdropdown.css";

function FilterDropdown({
  label,
  options,
  value = [],
  onChange,
  multi = true,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasSelection = multi
    ? Array.isArray(value) && value.length > 0
    : Boolean(value);

  const handleClear = (e) => {
    e.stopPropagation();

    onChange(multi ? [] : null);
    setOpen(false);
  };

  const isSelected = (opt) => {
    if (multi) {
      return Array.isArray(value)
        ? value.some((v) => v.value === opt.value)
        : false;
    }

    return value?.value === opt.value;
  };

  const handleSelect = (opt) => {
    if (multi) {
      const currentValue = Array.isArray(value) ? value : [];

      const exists = currentValue.some(
        (v) => v.value === opt.value,
      );

      if (exists) {
        onChange(
          currentValue.filter(
            (v) => v.value !== opt.value,
          ),
        );
      } else {
        onChange([...currentValue, opt]);
      }

      // Keep the menu open so multiple choices can be made
      setOpen(true);
    } else {
      onChange(isSelected(opt) ? null : opt);
      setOpen(false);
    }
  };

  const triggerLabel = multi
    ? Array.isArray(value) && value.length > 0
      ? value.map((v) => v.label).join(", ")
      : label
    : value?.label || label;

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`filter-dropdown-trigger ${
          open ? "open" : ""
        }`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="filter-dropdown-trigger-label">
          {triggerLabel}
        </span>

        {hasSelection ? (
          <span
            className="filter-dropdown-clear"
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label} filter`}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClear(e);
              }
            }}
          >
            ×
          </span>
        ) : (
          <span className="filter-dropdown-arrow">
            ▾
          </span>
        )}
      </button>

      {open && (
        <div className="filter-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`filter-dropdown-item ${
                isSelected(opt) ? "selected" : ""
              }`}
              onClick={() => handleSelect(opt)}
            >
              {opt.icon && (
                <span className="filter-item-icon">
                  {opt.icon}
                </span>
              )}

              {opt.image && (
                <img
                  src={opt.image}
                  alt={opt.label}
                  className="filter-item-image"
                />
              )}

              <div className="filter-item-text">
                <div className="filter-item-title">
                  {opt.label}

                  {typeof opt.count === "number" &&
                    ` (${opt.count})`}
                </div>

                {opt.description && (
                  <div className="filter-item-description">
                    {opt.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
