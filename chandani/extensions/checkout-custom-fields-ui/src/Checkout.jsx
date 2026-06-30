// @ts-nocheck
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useState, useCallback, useRef } from 'preact/hooks';
import { evaluateConditions } from '../../shared/conditions';
import { useCheckoutData } from '../../shared/useCheckoutData';

const BACKEND_URL = 'https://8crx9x5z-5000.inc1.devtunnels.ms';

export default async () => {
  render(<CheckoutExtension />, document.body);
};

const CheckoutExtension = () => {
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fieldValues, setFieldValues] = useState({});
  const fieldValuesRef = useRef({});
  fieldValuesRef.current = fieldValues;

  const shopDomain = shopify?.shop?.myshopifyDomain || '';
  const checkoutData = useCheckoutData();
  const { cartLines } = checkoutData;

  useEffect(() => {
    async function load() {
      if (!shopDomain) return;
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/checkout-customizations/public?shop=${encodeURIComponent(shopDomain)}&type=custom_field`
        );
        if (res.ok) {
          const data = await res.json();
          const blocks = data?.data?.customizations || [];
          setCustomFields(blocks);

          const initVals = {};
          for (const block of blocks) {
            initVals[block.id] = {};
            for (const f of block.fields || []) {
              if (f.type === 'checkbox') {
                initVals[block.id][f.key] = f.connectedToOrder ? true : !!f.defaultChecked;
              } else {
                initVals[block.id][f.key] = '';
              }
            }
          }
          setFieldValues(initVals);
          fieldValuesRef.current = initVals;

          for (const block of blocks) {
            for (const f of block.fields || []) {
              const val = initVals[block.id]?.[f.key];
              if (val !== undefined && val !== '') {
                saveToOrder(block, f.key, val, initVals[block.id]);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[CheckoutExt] Could not load custom fields:', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shopDomain]);

  const saveToOrder = useCallback(async (block, key, value, allVals = null) => {
    const setting = block.orderFieldSetting || 'order_metafield';
    const currentBlockVals = allVals || fieldValuesRef.current[block.id] || {};
    const nextBlockVals = { ...currentBlockVals, [key]: value };

    const f = (block.fields || []).find(field => field.key === key);
    const isCheckbox = f?.type === 'checkbox';
    const isValTrue = value === true || String(value) === 'true' || (f && (String(value) === f.label || String(value) === f.key));
    const formattedValue = isCheckbox ? (isValTrue ? (f?.label || key) : '') : String(value);

    try {
      if (setting === 'order_metafield' && shopify?.applyMetafieldsChange) {
        await shopify.applyMetafieldsChange({
          type: 'updateMetafield',
          namespace: 'checkout_customization',
          key,
          valueType: 'string',
          value: formattedValue,
        });
      } else if (setting === 'cart_attribute' && shopify?.applyCartLinesChange) {
        const attrKey = f?.label || key;

        if (shopify?.applyAttributeChange) {
          await shopify.applyAttributeChange({
            type: 'removeAttribute',
            key: attrKey,
          });
        }

        for (const line of cartLines) {
          const currentAttributes = line.attributes || [];
          const otherAttributes = currentAttributes.filter(attr => attr.key !== attrKey);
          const newAttributes = [...otherAttributes];

          const hasValue = isCheckbox ? isValTrue : (value !== undefined && value !== '');
          if (hasValue) {
            newAttributes.push({
              key: attrKey,
              value: isCheckbox ? '' : String(value),
            });
          }

          await shopify.applyCartLinesChange({
            type: 'updateCartLine',
            id: line.id,
            attributes: newAttributes,
          });
        }
      } else if (setting === 'cart_note' && shopify?.applyNoteChange) {
        const notes = [];
        for (const [k, v] of Object.entries(nextBlockVals)) {
          const fieldObj = (block.fields || []).find(field => field.key === k);
          if (fieldObj) {
            if (fieldObj.type === 'checkbox') {
              const isCheckedVal = v === true || String(v) === 'true' || String(v) === fieldObj.label || String(v) === fieldObj.key;
              if (isCheckedVal) {
                notes.push(fieldObj.label || k);
              }
            } else if (v !== undefined && v !== '') {
              notes.push(String(v));
            }
          }
        }
        await shopify.applyNoteChange({
          type: 'updateNote',
          note: notes.join('\n'),
        });
      }
    } catch (e) {
      console.warn('[CheckoutExt] saveToOrder error:', e);
    }
  }, [cartLines]);

  const handleChange = useCallback((block, key, value) => {
    setFieldValues(prev => {
      const next = { ...prev, [block.id]: { ...(prev[block.id] || {}), [key]: value } };
      fieldValuesRef.current = next;
      return next;
    });
    saveToOrder(block, key, value);
  }, [saveToOrder]);

  if (loading) return null;

  const visibleBlocks = customFields.filter(block => {
    const result = evaluateConditions(block.displayRule, block.displayConditions, checkoutData);
    console.log('[CheckoutCustomFields] block:', block.internalName, 'displayRule:', block.displayRule, 'displayConditions:', block.displayConditions, 'result:', result, 'checkoutData:', checkoutData);
    return result;
  });

  if (visibleBlocks.length === 0) {
    console.log('[CheckoutCustomFields] No visible blocks.');
    return null;
  }

  return (
    <s-box padding={['none', 'none', 'base', 'none']}>
      <s-stack direction="block" gap="large">
        {visibleBlocks.map(block => (
          <CustomFieldBlock
            key={block.id}
            block={block}
            values={fieldValues[block.id] || {}}
            onChange={(key, value) => handleChange(block, key, value)}
          />
        ))}
      </s-stack>
    </s-box>
  );
};

const CustomFieldBlock = ({ block, values, onChange }) => {
  const fields = block.fields || [];
  if (fields.length === 0) return null;

  return (
    <s-stack direction="block" gap="base">
      {fields.map(field => (
        <FieldRenderer
          key={field.key || field._id}
          field={field}
          value={values[field.key]}
          onChange={val => onChange(field.key, val)}
        />
      ))}
    </s-stack>
  );
};

const FieldRenderer = ({ field, value, onChange }) => {
  const label = field.required ? `${field.label} *` : field.label;

  switch (field.type) {
    case 'checkbox':
      return (
        <s-stack direction="block" gap="small-100">
          <s-grid gridTemplateColumns="auto 1fr" alignItems="center" gap="base">
            <s-checkbox
              id={`ccf-${field.key}`}
              checked={isChecked(value, field) || undefined}
              onChange={e => onChange(!!e.target.checked)}
            />
            <s-text>{label}</s-text>
          </s-grid>
          {field.helpText && (
            <s-text size="small" appearance="subdued">{field.helpText}</s-text>
          )}
        </s-stack>
      );

    case 'text_input':
    case 'phone_field':
      return (
        <s-text-field
          id={`ccf-${field.key}`}
          label={label}
          value={value || ''}
          type={field.type === 'phone_field' ? 'tel' : 'text'}
          placeholder={field.placeholder || ''}
          onInput={e => onChange(e.target.value)}
        />
      );

    case 'dropdown':
      return (
        <s-select
          id={`ccf-${field.key}`}
          label={label}
          value={value || ''}
          onChange={e => onChange(e.target.value || e.detail?.value || '')}
        >
          <s-option value="">Select an option</s-option>
          {(field.choices || []).map((c, i) => {
            const cVal = typeof c === 'string' ? c : c.value;
            const cLabel = typeof c === 'string' ? c : c.label;
            return (
              <s-option key={i} value={cVal}>{cLabel}</s-option>
            );
          })}
        </s-select>
      );

    case 'date_picker':
    case 'date_of_birth':
      return (
        <s-text-field
          id={`ccf-${field.key}`}
          label={label}
          value={value || ''}
          type="date"
          onInput={e => onChange(e.target.value)}
        />
      );

    case 'choice_list':
      return (
        <s-stack direction="block" gap="small-100">
          <s-text type="strong">{label}</s-text>
          {(field.choices || []).map((c, i) => {
            const cVal = typeof c === 'string' ? c : c.value;
            const cLabel = typeof c === 'string' ? c : c.label;
            const selected = String(value || '').split(',').filter(Boolean).includes(cVal);
            return (
              <s-stack key={i} direction="block" gap="none">
                <s-grid gridTemplateColumns="auto 1fr" alignItems="center" gap="base">
                  <s-checkbox
                    id={`ccf-${field.key}-${i}`}
                    checked={selected || undefined}
                    onChange={e => {
                      const curr = String(value || '').split(',').filter(Boolean);
                      const next = e.target.checked
                        ? [...curr, cVal]
                        : curr.filter(v => v !== cVal);
                      onChange(next.join(','));
                    }}
                  />
                  <s-text>{cLabel}</s-text>
                </s-grid>
              </s-stack>
            );
          })}
          {field.helpText && (
            <s-text size="small" appearance="subdued">{field.helpText}</s-text>
          )}
        </s-stack>
      );

    default:
      return null;
  }
};

const isChecked = (val, field) => {
  if (val === true || String(val) === 'true') return true;
  if (!val || val === false || String(val) === 'false') return false;
  if (val === field.label || val === field.key) return true;
  return false;
};
