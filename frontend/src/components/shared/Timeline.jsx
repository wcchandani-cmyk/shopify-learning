import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getInputEventValue } from "../../utils/fieldEvent";

function relativeOrTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  return date
    .toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

function dayKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toDateString();
}

function dayLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// Preserve incoming order (newest first) while bucketing by day.
function groupByDay(comments) {
  const groups = [];
  const byKey = new Map();
  comments.forEach((comment) => {
    const key = dayKey(comment.createdAt);
    if (!byKey.has(key)) {
      const group = { key, label: dayLabel(comment.createdAt), items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).items.push(comment);
  });
  return groups;
}

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
  </svg>
);

const FaceIcon = () => (
  <svg
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="7.25" />
    <circle cx="7.5" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
    <path d="M6.8 12.2c.9 1 5.5 1 6.4 0" strokeLinecap="round" />
  </svg>
);

const LinkIcon = () => (
  <svg
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M8.5 11.5a3 3 0 0 0 4.3.1l2-2a3 3 0 0 0-4.2-4.2l-1 1" />
    <path d="M11.5 8.5a3 3 0 0 0-4.3-.1l-2 2a3 3 0 0 0 4.2 4.2l1-1" />
  </svg>
);

const LogIcon = () => (
  <svg
    viewBox="0 0 20 20"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="14" height="12" rx="2" />
    <path d="M6 8h8M6 11h5" />
  </svg>
);

const TOOLBAR_ICONS = [
  { id: "emoji", node: <FaceIcon />, label: "Emoji" },
  {
    id: "mention",
    node: <span className="cust-timeline__tool-text">@</span>,
    label: "Mention",
  },
  {
    id: "hashtag",
    node: <span className="cust-timeline__tool-text">#</span>,
    label: "Hashtag",
  },
  { id: "link", node: <LinkIcon />, label: "Link" },
];

export default function Timeline({
  entityId,
  listComments,
  addComment,
  deleteComment,
}) {
  const shopify = useAppBridge();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!entityId || !listComments) return undefined;
    shopify
      .idToken()
      .then((token) => listComments(entityId, token))
      .then((data) => {
        if (active) setComments(data);
      })
      .catch(() => {
        if (active) setComments([]);
      });
    return () => {
      active = false;
    };
  }, [shopify, entityId, listComments]);

  const handlePost = useCallback(async () => {
    const body = text.trim();
    if (!body || posting || !addComment) return;
    setPosting(true);
    try {
      const token = await shopify.idToken();
      const created = await addComment(entityId, body, token);
      setComments((prev) => [created, ...prev]);
      setText("");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to post comment", {
        isError: true,
      });
    } finally {
      setPosting(false);
    }
  }, [text, posting, shopify, entityId, addComment]);

  const handleDelete = useCallback(
    async (commentId) => {
      if (!deleteComment) return;
      try {
        const token = await shopify.idToken();
        await deleteComment(entityId, commentId, token);
        setComments((prev) => prev.filter((item) => item.id !== commentId));
      } catch (err) {
        shopify.toast.show(err.message || "Failed to delete comment", {
          isError: true,
        });
      }
    },
    [shopify, entityId, deleteComment]
  );

  const groups = groupByDay(comments);

  return (
    <s-section heading="Timeline">
      <div className="cust-timeline">
        <div className="cust-timeline__composer">
          <div className="cust-timeline__composer-top">
            <span className="cust-timeline__avatar">
              <UserIcon />
            </span>
            <textarea
              className="cust-timeline__input"
              aria-label="Leave a comment"
              placeholder="Leave a comment..."
              rows={1}
              value={text}
              onInput={(event) => setText(getInputEventValue(event))}
              onChange={(event) => setText(getInputEventValue(event))}
            />
          </div>
          <div className="cust-timeline__toolbar">
            <div className="cust-timeline__tools">
              {TOOLBAR_ICONS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  className="cust-timeline__tool"
                  tabIndex={-1}
                  aria-label={tool.label}
                  onClick={(event) => event.preventDefault()}
                >
                  {tool.node}
                </button>
              ))}
            </div>
            <s-button
              variant="primary"
              onClick={handlePost}
              {...(posting ? { loading: true } : {})}
              {...(text.trim() ? {} : { disabled: true })}
            >
              Post
            </s-button>
          </div>
        </div>

        <div className="cust-timeline__caption">
          Only you and other staff can see comments
        </div>

        {comments.length === 0 ? (
          <div className="cust-timeline__empty">No activity yet</div>
        ) : (
          <div className="cust-timeline__feed">
            {groups.map((group) => (
              <div className="cust-timeline__group" key={group.key}>
                <div className="cust-timeline__group-label">{group.label}</div>
                {group.items.map((item) => (
                  <div className="cust-timeline__item" key={item.id}>
                    <span className="cust-timeline__dot" />
                    <span className="cust-timeline__item-icon">
                      <LogIcon />
                    </span>
                    <div className="cust-timeline__item-body">{item.body}</div>
                    <span className="cust-timeline__item-time">
                      {relativeOrTime(item.createdAt)}
                    </span>
                    <button
                      type="button"
                      className="cust-timeline__delete"
                      aria-label="Delete comment"
                      onClick={() => handleDelete(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </s-section>
  );
}
