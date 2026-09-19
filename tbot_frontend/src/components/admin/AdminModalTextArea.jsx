export default function AdminModalTextArea({ label, value, onChange }) {
  return (
    <label className="admin-modal-field admin-modal-textarea-field">
      {label && <span className="admin-modal-label">{label}</span>}

      <textarea
        className="admin-modal-textarea"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
      />
    </label>
  );
}
