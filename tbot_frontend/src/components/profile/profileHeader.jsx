import { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const YouTubeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="profile-social-icon"
  >
    <path
      d="M23 12s0-4-1-5-2-1-4-1H6C4 6 3 6 2 7s-1 5-1 5 0 4 1 5 2 1 4 1h12c2 0 3 0 4-1s1-5 1-5Z"
      fill="currentColor"
    />
    <path
      d="m10 9 5 3-5 3V9Z"
      fill="#101416"
    />
  </svg>
);

const TwitchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="profile-social-icon"
  >
    <path
      d="M4 2h17v12l-5 5h-4l-3 3v-3H4V2Zm3 3v10h3v3l3-3h4l2-2V5H7Zm3 2h2v5h-2V7Zm5 0h2v5h-2V7Z"
      fill="currentColor"
    />
  </svg>
);

const TikTokIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="profile-social-icon"
  >
    <path
      d="M15 3c.3 2 1.4 3.5 3.5 4.1V10c-1.4-.1-2.7-.6-3.5-1.4v6.2a5.2 5.2 0 1 1-4.5-5.1v2.9a2.3 2.3 0 1 0 1.6 2.2V3H15Z"
      fill="currentColor"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="profile-social-icon"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle
      cx="12"
      cy="12"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle
      cx="17.5"
      cy="6.5"
      r="1"
      fill="currentColor"
    />
  </svg>
);

const TwitterIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="profile-social-icon"
  >
    <path
      d="M18.9 2H22l-6.8 7.8L23.2 22h-6.2l-4.9-6.4L6.5 22H3.4l7.3-8.4L2.8 2H9l4.4 5.8L18.9 2Zm-1.1 17.7h1.7L8.3 4.2H6.5l11.3 15.5Z"
      fill="currentColor"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="profile-social-icon"
  >
    <path
      d="M19.5 5.2A16.7 16.7 0 0 0 15.3 4l-.5 1a15 15 0 0 0-5.6 0l-.5-1a16.7 16.7 0 0 0-4.2 1.2C1.8 9.1 1.1 13 1.4 16.9a16.9 16.9 0 0 0 5.2 2.6l1.3-1.8c-.7-.3-1.3-.7-1.9-1.1l.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4c-.6.4-1.2.8-1.9 1.1l1.3 1.8a16.9 16.9 0 0 0 5.2-2.6c.4-4.5-.8-8.4-3.5-11.7ZM8.5 14.1c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm7 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z"
      fill="currentColor"
    />
  </svg>
);

const socialConnections = [
  {
    key: "youtube_url",
    label: "YouTube",
    Icon: YouTubeIcon,
  },
  {
    key: "twitch_url",
    label: "Twitch",
    Icon: TwitchIcon,
  },
  {
    key: "tiktok_url",
    label: "TikTok",
    Icon: TikTokIcon,
  },
  {
    key: "instagram_url",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    key: "twitter_url",
    label: "Twitter/X",
    Icon: TwitterIcon,
  },
  {
    key: "discord_server_url",
    label: "Discord Server",
    Icon: DiscordIcon,
  },
];

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

  const availableSocialConnections = socialConnections.filter(
    ({ key }) => normalizeText(profile[key]),
  );

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
          <div className="profile-bio">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              skipHtml
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            >
              {profile.bio}
            </ReactMarkdown>
          </div>
        )}

        {availableSocialConnections.length > 0 && (
          <div className="profile-social-links">
            {availableSocialConnections.map(
              ({ key, label, Icon }) => (
                <a
                  key={key}
                  href={normalizeText(profile[key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-social-link"
                  aria-label={label}
                  title={label}
                >
                  <Icon />
                  <span className="profile-social-label">
                    {label}
                  </span>
                </a>
              ),
            )}
          </div>
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