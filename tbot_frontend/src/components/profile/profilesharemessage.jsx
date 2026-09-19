function ProfileShareMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="profile-share-message" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export default ProfileShareMessage;