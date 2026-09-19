import { useEffect, useState } from "react";

const normalizeText = (value) => String(value ?? "").trim();

const getAvatarUrl = (profile) => {
  if (!profile) {
    return "";
  }

  const avatar = normalizeText(profile.avatar);
  const discordId = normalizeText(profile.discord_id);

  if (!avatar) {
    if (discordId) {
      const numericId = Number(discordId);

      if (Number.isSafeInteger(numericId) && numericId >= 0) {
        const defaultAvatarIndex = (numericId >> 22) % 6;

        return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
      }
    }

    return "";
  }

  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("//")
  ) {
    return avatar;
  }

  if (
    avatar.startsWith("/avatars/") ||
    avatar.startsWith("/embed/avatars/")
  ) {
    return `https://cdn.discordapp.com${avatar}`;
  }

  if (!discordId) {
    return "";
  }

  const extension = avatar.startsWith("a_") ? "gif" : "png";

  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
};

function ProfileHeader({
  profile,
  isOwner,
  onShare,
  onEdit,
}) {
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar, profile?.discord_id]);

  if (!profile) {
    return null;
  }

  const profileName =
    profile.display_name || profile.username || "User";

  const avatarUrl = getAvatarUrl(profile);

  const username =
    profile.username ||
    profile.discord_username ||
    profile.display_name ||
    "User";

  return (
    <section className="profile-header">
      <div className="profile-avatar">
        {avatarUrl && !avatarError ? (
          <img
            src={avatarUrl}
            alt={`${profileName} avatar`}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className="profile-avatar-placeholder">
            {profileName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="profile-info">
        <h1>{profileName}</h1>

        <div className="profile-username">
          @{username}
        </div>

        {profile.bio && (
          <p className="profile-bio">
            {profile.bio}
          </p>
        )}

        <div className="profile-meta">
          {profile.is_public
            ? "Public profile"
            : "Private profile"}
        </div>
      </div>

      <div className="profile-header-actions">
        <button
          type="button"
          className="profile-share-button"
          onClick={onShare}
        >
          Share Profile
        </button>

        {isOwner && (
          <button
            type="button"
            className="profile-edit-button"
            onClick={onEdit}
          >
            Edit Profile
          </button>
        )}
      </div>
    </section>
  );
}

export default ProfileHeader;