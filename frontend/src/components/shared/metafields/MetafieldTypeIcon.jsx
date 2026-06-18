const ICON_TYPES = {
  text: "text",
  number: "hashtag",
  json: "code",
  paragraph: "text-block",
  rich_text: "text-bold",
  file: "file",
  reference: "arrow-diagonal",
  calendar: "calendar",
  link: "link",
  boolean: "toggle-off",
  color: "color",
  language: "language",
};

export default function MetafieldTypeIcon({ name }) {
  return (
    <s-icon type={ICON_TYPES[name] || "text"} size="small" color="subdued" />
  );
}
