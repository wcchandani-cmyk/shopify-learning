export default function EditorShell({
  icon,
  label,
  collapsed,
  onToggle,
  onRemove,
  children,
}) {
  return (
    <div className="ccf-field-editor">
      <div className="ccf-field-header">
        <span className="ccf-drag-handle">⠿</span>
        <span className="ccf-field-type-icon">
          <s-icon type={icon} />
        </span>
        <span className="ccf-field-type-name">{label}</span>
        <div className="ccf-field-header-actions">
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
        </div>
      </div>
      {!collapsed && <div className="ccf-field-body">{children}</div>}
    </div>
  );
}
