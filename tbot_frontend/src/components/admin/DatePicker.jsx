import { useEffect, useRef, useState } from "react";

function DatePicker({
  label,
  value,
  onChange,
  pickerId,
  openPicker,
  setOpenPicker,
}) {
  const open = openPicker === pickerId;

  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [year, month, day] = value.split("-").map(Number);

      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }

    return new Date();
  });

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpenPicker(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [setOpenPicker]);

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-").map(Number);

      if (year && month && day) {
        setViewDate(new Date(year, month - 1, 1));
      }
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  const selectedDate = value
    ? (() => {
        const [y, m, d] = value.split("-").map(Number);

        return y && m && d ? new Date(y, m - 1, d) : null;
      })()
    : null;

  const today = new Date();

  const isSameDate = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const selectDay = (day) => {
    onChange(formatDate(new Date(year, month, day)));
    setOpenPicker(null);
  };

  return (
    <div className="admin-modal-field custom-date-picker" ref={wrapperRef}>
      <span className="admin-modal-label">{label}</span>

      <button
        type="button"
        className={`custom-date-input${open ? " is-open" : ""}${
          value ? " has-value" : ""
        }`}
        onClick={() =>
          setOpenPicker((current) => (current === pickerId ? null : pickerId))
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{displayValue || "Select date..."}</span>

        <span className="custom-date-calendar-icon" aria-hidden="true">
          📅
        </span>
      </button>

      {open && (
        <div className="custom-date-calendar" role="dialog" aria-label={label}>
          <div className="custom-date-calendar-header">
            <button
              type="button"
              className="custom-date-nav"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              aria-label="Previous month"
            >
              ‹
            </button>

            <strong>
              {viewDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </strong>

            <button
              type="button"
              className="custom-date-nav"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="custom-date-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="custom-date-grid">
            {days.map((day, index) =>
              day === null ? (
                <span key={`empty-${index}`} className="custom-date-empty" />
              ) : (
                <button
                  key={day}
                  type="button"
                  className={`custom-date-day${
                    selectedDate &&
                    isSameDate(new Date(year, month, day), selectedDate)
                      ? " selected"
                      : ""
                  }${
                    isSameDate(new Date(year, month, day), today)
                      ? " today"
                      : ""
                  }`}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          <div className="custom-date-calendar-footer">
            <button
              type="button"
              className="custom-date-clear"
              onClick={() => {
                onChange("");
                setOpenPicker(null);
              }}
            >
              Clear
            </button>

            <button
              type="button"
              className="custom-date-today"
              onClick={() => {
                const current = new Date();

                onChange(formatDate(current));

                setViewDate(
                  new Date(current.getFullYear(), current.getMonth(), 1),
                );

                setOpenPicker(null);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
