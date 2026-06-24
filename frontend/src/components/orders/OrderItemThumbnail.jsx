export default function OrderItemThumbnail({ imageUrl, imageAlt, title }) {
  if (imageUrl) {
    return (
      <s-box
        border="base"
        borderRadius="base"
        overflow="hidden"
        inlineSize="40px"
        blockSize="40px"
      >
        <s-image objectFit="cover" src={imageUrl} alt={imageAlt || title} />
      </s-box>
    );
  }

  return (
    <div className="order-line-item-img-placeholder">
      <s-icon type="product" />
    </div>
  );
}
