import RequiredLabel from "./RequiredLabel";

const validationErrorStyle = {
  color: "#ff4d4d",
  fontSize: "0.82rem",
  fontWeight: 600,
  marginTop: "6px",
};

function TextField({
  label,
  value,
  onChange,
  required = false,
  error = "",
  type = "text",
}) {
  return (
    <label className="admin-modal-field">
      <span className="admin-modal-label">
        {required ? <RequiredLabel>{label}</RequiredLabel> : label}
      </span>

      <input
        data-field={label.toLowerCase()}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />

      {error && <span style={validationErrorStyle}>{error}</span>}
    </label>
  );
}

export default TextField;
