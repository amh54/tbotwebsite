import RequiredLabel from "./RequiredLabel";

const validationErrorStyle = {
  color: "#ff4d4d",
  fontSize: "0.82rem",
  fontWeight: 600,
  marginTop: "6px",
};

function TextArea({ label, value, onChange, required = false, error = "" }) {
  return (
    <label className="admin-modal-field admin-modal-textarea-field">
      {label && (
        <span className="admin-modal-label">
          {required ? <RequiredLabel>{label}</RequiredLabel> : label}
        </span>
      )}

      <textarea
        data-field={label.toLowerCase()}
        className="admin-modal-textarea"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
      />

      {error && <span style={validationErrorStyle}>{error}</span>}
    </label>
  );
}

export default TextArea;
