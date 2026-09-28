function AdminBugReportImageModal({
  screenshot,
  onClose,
}) {
  if (!screenshot) {
    return null;
  }

  return (
    <div
      className="admin-bugreport-image-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        className="admin-bugreport-image-close"
        onClick={onClose}
        aria-label="Close screenshot"
      >
        ×
      </button>

      <img
        src={screenshot}
        alt="Bug report screenshot enlarged"
        onError={(event) => {
          console.error(
            "Failed to load enlarged screenshot:",
            screenshot,
          );

          event.currentTarget.alt =
            "Unable to load screenshot";
        }}
      />
    </div>
  );
}

export default AdminBugReportImageModal;