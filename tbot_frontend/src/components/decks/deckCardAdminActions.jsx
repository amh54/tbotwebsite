function DeckCardAdminActions({
  editing,
  isSaving,
  startEditing,
  handleDelete,
  cancelEditing,
  handleEditSave,
}) {
  return (
    <div className="admin-modal-actions">
      {!editing ? (
        <>
          <button
            type="button"
            className="admin-modal-edit"
            onClick={startEditing}
            disabled={isSaving}
          >
            Edit Deck
          </button>

          <button
            type="button"
            className="admin-modal-delete"
            onClick={handleDelete}
            disabled={isSaving}
          >
            Delete Deck
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="admin-modal-edit"
            onClick={cancelEditing}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="admin-modal-save"
            onClick={handleEditSave}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </>
      )}
    </div>
  );
}

export default DeckCardAdminActions;