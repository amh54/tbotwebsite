export default function AdminModalField({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <label className="admin-modal-field">
      <span className="admin-modal-label">{label}</span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
