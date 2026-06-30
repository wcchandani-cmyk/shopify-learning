const ConditionOperatorSelect = ({ value, onChange, isNumeric, isBoolean = false, isCheckout = false }) => {
  return (
    <s-select
      value={value}
      onChange={onChange}
    >
      {isCheckout && <s-option value="">Select Rule Condition</s-option>}
      {isNumeric ? (
        <>
          <s-option value="greater_than_or_equals">Greater than or equals</s-option>
          <s-option value="less_than_or_equals">Less than or equals</s-option>
        </>
      ) : isBoolean ? (
        <>
          <s-option value="equals">Is equal to</s-option>
          <s-option value="not_equals">Is not equal to</s-option>
        </>
      ) : (
        <>
          <s-option value="contains">Contains</s-option>
          <s-option value="not_contains">
            {isCheckout ? "Does not contains" : "Not contains"}
          </s-option>
        </>
      )}
    </s-select>
  );
};

export default ConditionOperatorSelect;
