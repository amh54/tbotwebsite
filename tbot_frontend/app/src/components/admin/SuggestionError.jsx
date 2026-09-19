function SuggestionError({ title, message, onClose }) {
  return (
    <div className="admin-bugreports-error">
      <strong>{title}</strong>

      <span>{message}</span>

      {onClose && (
        <button type="button" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

export default SuggestionError;
