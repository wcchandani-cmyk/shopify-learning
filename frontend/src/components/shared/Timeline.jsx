import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getInputEventValue } from "../../utils/fieldEvent";
import { getShopDetails } from "../../services/shopService";

function initialOf(name) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "";
}

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

const TOOLBAR_ICONS = [
  { id: "emoji", node: <s-icon type="emoji" />, label: "Emoji" },
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
  { id: "link", node: <s-icon type="link" />, label: "Link" },
];

export default function Timeline({
  entityId,
  listComments,
  addComment,
  deleteComment,
  reloadTrigger,
}) {
  const shopify = useAppBridge();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    let active = true;
    shopify
      .idToken()
      .then((token) => getShopDetails(token))
      .then((shop) => {
        if (active) setAuthorName(shop?.name || shop?.shopOwner || "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [shopify]);

  const authorInitial = useMemo(() => initialOf(authorName), [authorName]);

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
  }, [shopify, entityId, listComments, reloadTrigger]);

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
            <span
              className="cust-timeline__avatar"
              title={authorName || undefined}
            >
              {authorInitial || <s-icon type="customers" />}
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
                      <s-icon type="note" />
                    </span>
                    {item.isSystemEvent ? (
                      <div
                        className="cust-timeline__item-body"
                        dangerouslySetInnerHTML={{ __html: item.body }}
                      />
                    ) : (
                      <div className="cust-timeline__item-body">{item.body}</div>
                    )}
                    <span className="cust-timeline__item-time">
                      {relativeOrTime(item.createdAt)}
                    </span>
                    {!item.isSystemEvent && (
                      <button
                        type="button"
                        className="cust-timeline__delete"
                        aria-label="Delete comment"
                        onClick={() => handleDelete(item.id)}
                      >
                        ×
                      </button>
                    )}
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
