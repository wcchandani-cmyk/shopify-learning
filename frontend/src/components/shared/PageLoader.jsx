export default function PageLoader({ accessibilityLabel = "Loading" }) {
  return (
    <div className="page-loader" role="status">
      <s-spinner size="large" accessibilityLabel={accessibilityLabel} />
    </div>
  );
}
