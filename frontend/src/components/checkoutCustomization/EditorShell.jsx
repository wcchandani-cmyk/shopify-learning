export default function EditorShell({
  icon,
  label,
  collapsed,
  onToggle,
  onRemove,
  children,
}) {
  return (
    <s-box border="base" borderRadius="base">
      <s-stack gap="none">
        <s-box padding="base" background="bg-surface-secondary">
          <s-stack direction="inline" alignItems="center" gap="base">
            <span className="ccf-drag-handle">⠿</span>
            <s-icon type={icon} />
            <s-box grow="1">
              <s-text type="strong">{label}</s-text>
            </s-box>
            <s-button-group gap="tight">
              <s-button
                variant="tertiary"
                icon={collapsed ? "chevron-down" : "chevron-up"}
                accessibilityLabel={collapsed ? "Expand" : "Collapse"}
                onClick={onToggle}
              />
              <s-button
                variant="tertiary"
                tone="critical"
                icon="delete"
                accessibilityLabel="Remove"
                onClick={onRemove}
              />
            </s-button-group>
          </s-stack>
        </s-box>
        {!collapsed && (
          <s-box padding="base">
            {children}
          </s-box>
        )}
      </s-stack>
    </s-box>
  );
}
