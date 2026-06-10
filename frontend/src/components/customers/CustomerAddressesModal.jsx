import { addressLines, customerHasAddress } from "../../utils/customerForm";

export default function CustomerAddressesModal({
  manageModalId,
  address,
  recipientName,
  onEditAddress,
  onAddAddress,
}) {
  const lines = addressLines(address, recipientName);
  const hasAddress = customerHasAddress(address);

  return (
    <s-modal id={manageModalId} heading="Manage addresses">
      {hasAddress ? (
        <s-box
          border="base"
          borderRadius="base"
          padding="base"
          background="subdued"
        >
          <s-stack gap="small-300">
            <s-stack
              direction="inline"
              alignItems="center"
              justifyContent="space-between"
            >
              <s-badge>Default</s-badge>
              <s-button
                variant="tertiary"
                icon="edit"
                accessibilityLabel="Edit address"
                command="--hide"
                commandFor={manageModalId}
                onClick={onEditAddress}
              />
            </s-stack>
            <s-stack gap="small-400">
              {lines.map((line, index) => (
                <s-text key={index}>{line}</s-text>
              ))}
            </s-stack>
          </s-stack>
        </s-box>
      ) : (
        <s-stack gap="base" alignItems="start">
          <s-text color="subdued">No addresses yet.</s-text>
          <s-button
            icon="plus-circle"
            command="--hide"
            commandFor={manageModalId}
            onClick={onAddAddress}
          >
            Add address
          </s-button>
        </s-stack>
      )}

      <s-button
        slot="primary-action"
        command="--hide"
        commandFor={manageModalId}
        onClick={onAddAddress}
      >
        Add new address
      </s-button>
    </s-modal>
  );
}
