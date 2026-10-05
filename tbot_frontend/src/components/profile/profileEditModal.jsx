function ProfileEditModal({
  open,
  saving,
  error,
  displayName,
  profileSlug,
  bio,
  isPublic,
  youtubeUrl,
  twitchUrl,
  tiktokUrl,
  instagramUrl,
  discordServerUrl,
  onDisplayNameChange,
  onProfileSlugChange,
  onBioChange,
  onPublicChange,
  onYoutubeUrlChange,
  onTwitchUrlChange,
  onTiktokUrlChange,
  onInstagramUrlChange,
  onDiscordServerUrlChange,
  twitterUrl,
  onTwitterUrlChange,
  onSubmit,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="profile-edit-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="profile-edit-modal">
        <h2>Edit Profile</h2>

        <form className="profile-edit-form" onSubmit={onSubmit}>
          {error && <div className="profile-edit-error">{error}</div>}

          <div className="profile-edit-field">
            <label htmlFor="profile-display-name">Display Name</label>

            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              maxLength={100}
              onChange={(event) => onDisplayNameChange(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="profile-edit-field">
            <label htmlFor="profile-slug">Profile URL</label>

            <input
              id="profile-slug"
              type="text"
              value={profileSlug}
              maxLength={100}
              onChange={(event) =>
                onProfileSlugChange(
                  event.target.value.toLowerCase().replace(/\s+/g, "-"),
                )
              }
              disabled={saving}
            />

            <small>
              Your profile will be available at /profile/
              {profileSlug || "your-name"}
            </small>
          </div>

          <div className="profile-edit-field">
            <label htmlFor="profile-bio">Bio (Markdown Suppported)</label>

            <textarea
              id="profile-bio"
              value={bio}
              maxLength={2000}
              onChange={(event) => onBioChange(event.target.value)}
              placeholder="Tell people a little about yourself..."
              disabled={saving}
            />

            <small>{bio.length}/2000 characters</small>
          </div>

          <div className="profile-edit-social">
            <div className="profile-edit-social-header">
              <h3>Social Connections</h3>

              <p>Add links to your social platforms and Discord server.</p>
            </div>

            <div className="profile-edit-field">
              <label htmlFor="profile-youtube">YouTube</label>

              <input
                id="profile-youtube"
                type="url"
                value={youtubeUrl}
                maxLength={500}
                onChange={(event) => onYoutubeUrlChange(event.target.value)}
                placeholder="https://youtube.com/@yourname"
                disabled={saving}
              />
            </div>

            <div className="profile-edit-field">
              <label htmlFor="profile-twitch">Twitch</label>

              <input
                id="profile-twitch"
                type="url"
                value={twitchUrl}
                maxLength={500}
                onChange={(event) => onTwitchUrlChange(event.target.value)}
                placeholder="https://twitch.tv/yourname"
                disabled={saving}
              />
            </div>

            <div className="profile-edit-field">
              <label htmlFor="profile-tiktok">TikTok</label>

              <input
                id="profile-tiktok"
                type="url"
                value={tiktokUrl}
                maxLength={500}
                onChange={(event) => onTiktokUrlChange(event.target.value)}
                placeholder="https://tiktok.com/@yourname"
                disabled={saving}
              />
            </div>

            <div className="profile-edit-field">
              <label htmlFor="profile-instagram">Instagram</label>

              <input
                id="profile-instagram"
                type="url"
                value={instagramUrl}
                maxLength={500}
                onChange={(event) => onInstagramUrlChange(event.target.value)}
                placeholder="https://instagram.com/yourname"
                disabled={saving}
              />
            </div>
            <div className="profile-edit-field">
              <label htmlFor="profile-twitter">Twitter/X</label>

              <input
                id="profile-twitter"
                type="url"
                value={twitterUrl}
                maxLength={500}
                onChange={(event) => onTwitterUrlChange(event.target.value)}
                placeholder="https://x.com/yourname"
                disabled={saving}
              />
            </div>
            <div className="profile-edit-field">
              <label htmlFor="profile-discord-server">Discord Server</label>

              <input
                id="profile-discord-server"
                type="url"
                value={discordServerUrl}
                maxLength={500}
                onChange={(event) =>
                  onDiscordServerUrlChange(event.target.value)
                }
                placeholder="https://discord.gg/yourinvite"
                disabled={saving}
              />
            </div>
          </div>

          <div className="profile-public-toggle">
            <div className="profile-public-toggle-info">
              <p className="profile-public-toggle-title">Public Profile</p>

              <p className="profile-public-toggle-description">
                Public profiles can be discovered by other users. Private
                profiles can still be shared directly with someone using the
                profile link.
              </p>
            </div>

            <label className="profile-switch">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => onPublicChange(event.target.checked)}
                disabled={saving}
              />

              <span className="profile-switch-slider" />
            </label>
          </div>

          <div className="profile-edit-actions">
            <button
              type="button"
              className="profile-edit-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-edit-save"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileEditModal;
