export default function ProductThumbnail({ title, imageUrl, imageAlt, size = 40 }) {
  const dimension = `${size}px`;
  const boxProps = {
    border: "base",
    borderRadius: "base",
    overflow: "hidden",
    inlineSize: dimension,
    blockSize: dimension,
  };

  if (imageUrl) {
    return (
      <s-box {...boxProps}>
        <s-image objectFit="cover" src={imageUrl} alt={imageAlt || title} />
      </s-box>
    );
  }

  return (
    <s-box {...boxProps} background="subdued">
      <s-stack alignItems="center" justifyContent="center" blockSize="100%">
        <s-text type="strong">{title.charAt(0).toUpperCase()}</s-text>
      </s-stack>
    </s-box>
  );
}
