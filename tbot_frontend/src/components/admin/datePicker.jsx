import { useEffect, useRef, useState } from "react";

function parseDate(value) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function DatePicker({
  label,
  value,
  onChange,
  pickerId,
  openPicker,
  setOpenPicker,
}) {
  const open = openPicker === pickerId;
  const selectedDate = parseDate(value);
  const wrapperRef = useRef(null);

  const [viewDate, setViewDate] = useState(
    () => {
      const initialDate = parseDate(value);
      const current = initialDate || new Date();

      return new Date(current.getFullYear(), current.getMonth(), 1);
    },
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpenPicker(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [setOpenPicker]);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        ),
      );
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [
    ...Array.from({ length: firstDay }, (_, index) => ({
      type: "empty",
      id: `empty-${year}-${month}-${index}`,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      type: "day",
      day: index + 1,
    })),
  ];

  const today = new Date();

  const isSameDate = (a, b) =>
    Boolean(
      a &&
        b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate(),
    );

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
          selectedDate ? " has-value" : ""
        }`}
        onClick={() =>
          setOpenPicker((current) =>
            current === pickerId ? null : pickerId,
          )
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
        <dialog
          className="custom-date-calendar"
          open
          aria-label={label}
        >
          <div className="custom-date-calendar-header">
            <button
              type="button"
              className="custom-date-nav"
              onClick={() =>
                setViewDate(new Date(year, month - 1, 1))
              }
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
              onClick={() =>
                setViewDate(new Date(year, month + 1, 1))
              }
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="custom-date-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <span key={day}>{day}</span>
              ),
            )}
          </div>

          <div className="custom-date-grid">
            {days.map((item) =>
              item.type === "empty" ? (
                <span
                  key={item.id}
                  className="custom-date-empty"
                  aria-hidden="true"
                />
              ) : (
                <button
                  key={item.day}
                  type="button"
                  className={`custom-date-day${
                    isSameDate(
                      new Date(year, month, item.day),
                      selectedDate,
                    )
                      ? " selected"
                      : ""
                  }${
                    isSameDate(
                      new Date(year, month, item.day),
                      today,
                    )
                      ? " today"
                      : ""
                  }`}
                  onClick={() => selectDay(item.day)}
                  aria-pressed={isSameDate(
                    new Date(year, month, item.day),
                    selectedDate,
                  )}
                >
                  {item.day}
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
                  new Date(
                    current.getFullYear(),
                    current.getMonth(),
                    1,
                  ),
                );
                setOpenPicker(null);
              }}
            >
              Today
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default DatePicker;