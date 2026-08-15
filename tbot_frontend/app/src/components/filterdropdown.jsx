import { useState, useRef, useEffect } from "react";
import "../css/filterdropdown.css";

function FilterDropdown({ label, options, value, onChange, multi = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSelected = (opt) =>
    multi
      ? value.some((v) => v.value === opt.value)
      : value?.value === opt.value;

  const handleSelect = (opt) => {
    if (multi) {
      const exists = value.some((v) => v.value === opt.value);
      onChange(
        exists ? value.filter((v) => v.value !== opt.value) : [...value, opt],
      );
      setOpen(false);
    } else {
      onChange(isSelected(opt) ? null : opt);
      setOpen(false);
    }
  };
  const triggerLabel = multi
    ? value.length > 0
      ? value.map((v) => v.label).join(", ")
      : label
    : value?.label || label;

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`filter-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {triggerLabel}
        <span className="filter-dropdown-arrow">▾</span>
      </button>

      {open && (
        <div className="filter-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`filter-dropdown-item ${isSelected(opt) ? "selected" : ""}`}
              onClick={() => handleSelect(opt)}
            >
              {opt.icon && <span className="filter-item-icon">{opt.icon}</span>}
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
                  {typeof opt.count === "number" && ` (${opt.count})`}
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
