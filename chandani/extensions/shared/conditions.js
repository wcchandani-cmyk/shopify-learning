export const checkConditionRule = (rule, data) => {
  const { type, operator, value } = rule;
  if (!type) return true;

  let actualValue = '';

  switch (type) {
    case 'cart_total':
      actualValue = data.totalAmount?.amount ?? 0;
      break;
    case 'cart_subtotal':
      actualValue = data.subtotalAmount?.amount ?? 0;
      break;
    case 'product': {
      const targetIds = String(value || '').split(',').map(id => id.trim().toLowerCase());
      const hasProduct = data.cartLines.some(line => {
        const prodId = String(line.merchandise?.product?.id || '').toLowerCase();
        return targetIds.some(tid => prodId.includes(tid) || tid.includes(prodId));
      });
      return operator === 'contains' ? hasProduct : !hasProduct;
    }
    case 'product_vendor': {
      const targetVendors = String(value || '').split(',').map(v => v.trim().toLowerCase());
      const hasVendor = data.cartLines.some(line => {
        const vendor = String(line.merchandise?.product?.vendor || '').toLowerCase();
        return targetVendors.some(tv => vendor.includes(tv));
      });
      return operator === 'contains' ? hasVendor : !hasVendor;
    }
    case 'product_type': {
      const targetTypes = String(value || '').split(',').map(t => t.trim().toLowerCase());
      const hasType = data.cartLines.some(line => {
        const productType = String(line.merchandise?.product?.productType || '').toLowerCase();
        return targetTypes.some(tt => productType.includes(tt));
      });
      return operator === 'contains' ? hasType : !hasType;
    }
    case 'line_item_selling_plan': {
      const hasPlan = data.cartLines.some(line => !!line.sellingPlanAllocation);
      const expected = String(value) === 'true';
      return operator === 'equals' ? (hasPlan === expected) : (hasPlan !== expected);
    }
    case 'line_item_properties': {
      const targetVal = String(value || '').toLowerCase();
      const hasProp = data.cartLines.some(line => 
        (line.properties || []).some(prop => 
          String(prop.name || '').toLowerCase().includes(targetVal) || 
          String(prop.value || '').toLowerCase().includes(targetVal)
        )
      );
      return operator === 'contains' ? hasProp : !hasProp;
    }
    case 'cart_currency':
      actualValue = data.cost?.totalAmount?.currencyCode || '';
      break;
    case 'cart_discount_code': {
      const targetCodes = String(value || '').split(',').map(c => c.trim().toLowerCase());
      const hasCode = data.discountCodes.some(dc => 
        targetCodes.some(tc => String(dc.code || '').toLowerCase().includes(tc))
      );
      return operator === 'contains' ? hasCode : !hasCode;
    }
    case 'cart_note':
      actualValue = data.cartNote || '';
      break;
    case 'cart_attributes': {
      const targetVal = String(value || '').toLowerCase();
      const hasAttr = data.cartAttributes.some(attr => 
        String(attr.key || '').toLowerCase().includes(targetVal) || 
        String(attr.value || '').toLowerCase().includes(targetVal)
      );
      return operator === 'contains' ? hasAttr : !hasAttr;
    }
    case 'shipping_country_code':
      actualValue = data.shippingAddress?.countryCode || '';
      break;
    case 'shipping_province_code':
      actualValue = data.shippingAddress?.provinceCode || '';
      break;
    case 'shipping_zip_code':
      actualValue = data.shippingAddress?.zip || '';
      break;
    case 'shipping_city':
      actualValue = data.shippingAddress?.city || '';
      break;
    case 'shipping_address_line':
      actualValue = `${data.shippingAddress?.address1 || ''} ${data.shippingAddress?.address2 || ''}`;
      break;
    case 'billing_country_code':
      actualValue = data.billingAddress?.countryCode || '';
      break;
    case 'billing_province_code':
      actualValue = data.billingAddress?.provinceCode || '';
      break;
    case 'billing_zip_code':
      actualValue = data.billingAddress?.zip || '';
      break;
    case 'billing_city':
      actualValue = data.billingAddress?.city || '';
      break;
    case 'billing_address_line':
      actualValue = `${data.billingAddress?.address1 || ''} ${data.billingAddress?.address2 || ''}`;
      break;
    case 'customer_email':
      actualValue = data.buyerIdentity?.email || '';
      break;
    case 'customer_language':
      actualValue = data.buyerIdentity?.locale || '';
      break;
    case 'customer_logged_in': {
      const isLoggedIn = !!data.buyerIdentity?.customer;
      const expected = String(value) === 'true';
      return operator === 'equals' ? (isLoggedIn === expected) : (isLoggedIn !== expected);
    }
    default:
      return true;
  }

  const actualStr = String(actualValue).toLowerCase();
  const ruleStr = String(value).toLowerCase();

  switch (operator) {
    case 'contains':
      return actualStr.includes(ruleStr);
    case 'not_contains':
      return !actualStr.includes(ruleStr);
    case 'equals':
      return actualStr === ruleStr;
    case 'not_equals':
      return actualStr !== ruleStr;
    case 'greater_than_or_equals':
      return Number(actualValue) >= Number(value);
    case 'less_than_or_equals':
      return Number(actualValue) <= Number(value);
    default:
      return true;
  }
};

export const evaluateConditions = (displayRule, displayConditions, data) => {
  if (displayRule === 'all') return true;
  if (!displayConditions) return true;

  const combination = displayConditions.combination || 'all';
  const conditions = displayConditions.conditions || [];

  if (conditions.length === 0) return true;

  if (combination === 'any') {
    return conditions.some(rule => checkConditionRule(rule, data));
  } else {
    return conditions.every(rule => checkConditionRule(rule, data));
  }
};
