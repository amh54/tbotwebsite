import RequiredLabel from "./RequiredLabel";

const MAX_CARD_RATIO = 4;
const TARGET_CARD_RATIO_TOTAL = 40;

const validationErrorStyle = {
  color: "#ff4d4d",
  fontSize: "0.82rem",
  fontWeight: 600,
  marginTop: "6px",
};

function CardRatioEditor({ options, onChange, disabled, total, error }) {
  if (!options?.length) {
    return null;
  }

  return (
    <div className="admin-modal-field admin-modal-cards-ratio">
      <span className="admin-modal-label">
        <RequiredLabel>
          Card Ratios (must total {TARGET_CARD_RATIO_TOTAL})
        </RequiredLabel>
      </span>

      {options.map((option) => {
        const count = option.count ?? 1;

        return (
          <div className="admin-modal-ratio-row" key={option.value}>
            <span className="admin-modal-ratio-name">{option.label}</span>

            <button
              type="button"
              onClick={() => onChange(option.value, -1)}
              disabled={disabled}
              aria-label={`Decrease ${option.label} count`}
            >
              −
            </button>

            <span className="admin-modal-ratio-count">{count}</span>

            <button
              type="button"
              onClick={() => onChange(option.value, 1)}
              disabled={disabled || count >= MAX_CARD_RATIO}
              aria-label={`Increase ${option.label} count`}
            >
              +
            </button>
          </div>
        );
      })}

      <div
        className={`admin-modal-ratio-total ${
          total === TARGET_CARD_RATIO_TOTAL ? "is-valid" : "is-invalid"
        }`}
      >
        Total: {total} / {TARGET_CARD_RATIO_TOTAL}
      </div>

      {error && <div style={validationErrorStyle}>{error}</div>}
    </div>
  );
}

export default CardRatioEditor;
