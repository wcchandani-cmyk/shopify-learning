export default function MarketingChannelRow({
  iconType,
  title,
  subscribed,
  detail,
  onToggle,
}) {
  return (
    <s-box padding="base">
      <s-stack
        direction="inline"
        gap="base"
        alignItems="center"
        justifyContent="space-between"
      >
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-icon type={iconType} color="subdued" />
          <s-stack gap="extra-tight">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-text fontWeight="bold">{title}</s-text>
              <s-badge tone={subscribed ? "success" : undefined}>
                {subscribed ? "Subscribed" : "Not subscribed"}
              </s-badge>
            </s-stack>
            <s-text color="subdued">{detail}</s-text>
          </s-stack>
        </s-stack>
        <s-switch checked={subscribed || undefined} onChange={onToggle} />
      </s-stack>
    </s-box>
  );
}
