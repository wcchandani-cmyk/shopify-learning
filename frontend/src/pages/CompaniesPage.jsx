import { useAppBridge } from "@shopify/app-bridge-react";
import CompanyList from "../components/customers/CompanyList";

export default function CompaniesPage() {
  const shopify = useAppBridge();

  return (
    <s-page heading="Companies">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() =>
          shopify.toast.show(
            "Please create companies directly via Shopify Admin B2B settings."
          )
        }
      >
        Add company
      </s-button>
      <CompanyList />
    </s-page>
  );
}
