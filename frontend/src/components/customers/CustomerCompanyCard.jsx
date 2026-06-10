const COMPANY_MENU_ID = "customer-company-menu";

export default function CustomerCompanyCard({ company, onRemove, onManage }) {
  if (!company) return null;

  return (
    <s-section>
      <s-stack gap="base">
        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-heading>Company</s-heading>
          <s-button
            variant="tertiary"
            icon="menu-horizontal"
            accessibilityLabel="Company actions"
            commandFor={COMPANY_MENU_ID}
          />
        </s-stack>

        <span className="cust-company-link">{company.name}</span>
      </s-stack>

      <s-menu id={COMPANY_MENU_ID} accessibilityLabel="Company actions">
        <s-button tone="critical" onClick={onRemove}>
          Delete company
        </s-button>
      </s-menu>
    </s-section>
  );
}
