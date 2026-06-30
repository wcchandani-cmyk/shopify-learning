const ConditionTypeSelect = ({ source, value, onChange, showAddress = true }) => {
  return (
    <s-select
      value={value}
      onChange={onChange}
    >
      {source === "checkout" ? (
        <>
          <s-option value="">Select Rule type</s-option>

          <s-option disabled>Cart Details</s-option>
          <s-option value="cart_total">Cart total</s-option>
          <s-option value="cart_subtotal">Cart subtotal</s-option>

          <s-option disabled>Cart Has Any Items</s-option>
          <s-option value="product">Product</s-option>
          <s-option value="product_vendor">Product vendor</s-option>
          <s-option value="product_type">Product type</s-option>
          <s-option value="line_item_selling_plan">Line item has selling plan</s-option>
          <s-option value="line_item_properties">Line item properties</s-option>
          <s-option value="cart_currency">Cart currency</s-option>
          <s-option value="cart_discount_code">Cart discount code</s-option>
          <s-option value="cart_note">Cart note</s-option>
          <s-option value="cart_attributes">Cart attributes</s-option>

          <s-option disabled>Shipping Address</s-option>
          <s-option value="shipping_country_code">Country code</s-option>
          <s-option value="shipping_province_code">Province code / State code</s-option>
          <s-option value="shipping_zip_code">Zip code / Postal code</s-option>
          <s-option value="shipping_city">City / Area</s-option>
          <s-option value="shipping_address_line">Address line</s-option>

          <s-option disabled>Billing Address</s-option>
          <s-option value="billing_country_code">Country code</s-option>
          <s-option value="billing_province_code">Province code / State code</s-option>
          <s-option value="billing_zip_code">Zip code / Postal code</s-option>
          <s-option value="billing_city">City / Area</s-option>
          <s-option value="billing_address_line">Address line</s-option>

          <s-option disabled>Customer</s-option>
          <s-option value="customer_email">Customer email</s-option>
          <s-option value="customer_language">Customer language</s-option>
          <s-option value="customer_logged_in">Customer is logged in</s-option>
        </>
      ) : (
        <>
          <s-option disabled>Cart Details</s-option>
          <s-option value="total_amount">Total Amount</s-option>
          <s-option value="subtotal_amount">Subtotal Amount</s-option>
          <s-option value="total_weight">Total Weight</s-option>

          <s-option disabled>Cart Has Any Items</s-option>
          <s-option value="sku">SKU</s-option>
          <s-option value="collection">Choose Collection</s-option>
          <s-option value="product">Choose Product</s-option>

          {showAddress && (
            <>
              <s-option disabled>Address</s-option>
              <s-option value="country_code">Country Code</s-option>
              <s-option value="province_code">Province Code / State Code</s-option>
              <s-option value="zip_code">Zip Code / Postal Code</s-option>
              <s-option value="city">City / Area</s-option>
              <s-option value="address_line">Address Line</s-option>
            </>
          )}

          <s-option disabled>Customer</s-option>
          <s-option value="customer_tag">Customer tags</s-option>
          <s-option value="total_spend">Total Spend</s-option>
          <s-option value="total_orders">Total Orders</s-option>
        </>
      )}
    </s-select>
  );
};

export default ConditionTypeSelect;
