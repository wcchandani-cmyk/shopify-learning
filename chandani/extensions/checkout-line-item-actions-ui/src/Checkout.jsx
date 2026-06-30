// @ts-nocheck
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useState, useCallback } from 'preact/hooks';
import { evaluateConditions } from '../../shared/conditions';
import { useCheckoutData } from '../../shared/useCheckoutData';

const BACKEND_URL = 'https://8crx9x5z-5000.inc1.devtunnels.ms';

export default async () => {
  render(<CheckoutExtension />, document.body);
};

const CheckoutExtension = () => {
  const [lineItemBlocks, setLineItemBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const shopDomain = shopify?.shop?.myshopifyDomain || '';
  const checkoutData = useCheckoutData();
  const { cartLines } = checkoutData;

  useEffect(() => {
    async function load() {
      if (!shopDomain) return;
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/checkout-customizations/public?shop=${encodeURIComponent(shopDomain)}&type=line_item_actions`
        );
        if (res.ok) {
          const data = await res.json();
          const blocks = data?.data?.customizations || [];
          setLineItemBlocks(blocks);
        }
      } catch (e) {
        console.warn('[CheckoutExt] Could not load line item actions:', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shopDomain]);

  if (loading) return null;

  const visibleBlocks = lineItemBlocks.filter(block => {
    const result = evaluateConditions(block.displayRule, block.displayConditions, checkoutData);
    console.log('[CheckoutLineItemActions] block:', block.internalName, 'displayRule:', block.displayRule, 'displayConditions:', block.displayConditions, 'result:', result, 'checkoutData:', checkoutData);
    return result;
  });

  if (visibleBlocks.length === 0 || cartLines.length === 0) {
    console.log('[CheckoutLineItemActions] No visible blocks.');
    return null;
  }

  return (
    <s-box padding={['none', 'none', 'base', 'none']}>
      <s-stack direction="block" gap="large">
        {visibleBlocks.map(block => (
          <LineItemActionsBlock key={block.id} block={block} cartLines={cartLines} />
        ))}
      </s-stack>
    </s-box>
  );
};

const LineItemActionsBlock = ({ block, cartLines }) => {
  const [selectedLineId, setSelectedLineId] = useState(() => cartLines[0]?.id || '');

  useEffect(() => {
    if (cartLines.length > 0 && !cartLines.some(line => line.id === selectedLineId)) {
      setSelectedLineId(cartLines[0].id);
    }
  }, [cartLines, selectedLineId]);

  const selectedLine = cartLines.find(line => line.id === selectedLineId);

  return (
    <s-stack direction="block" gap="base">
      {block.heading && <s-heading level="2">{block.heading}</s-heading>}
      {block.subheading && <s-text appearance="subdued">{block.subheading}</s-text>}
      
      <s-box border="base" borderRadius="base" padding="base">
        <s-stack direction="block" gap="base">
          {cartLines.length > 1 && (
            <s-select
              label="Select product to edit"
              value={selectedLineId}
              onChange={e => {
                const val = e.target.value || e.detail?.value || '';
                if (val) {
                  setSelectedLineId(val);
                }
              }}
            >
              {cartLines.map(line => (
                <s-option key={line.id} value={line.id}>
                  {line.merchandise?.product?.title} ({line.merchandise?.title})
                </s-option>
              ))}
            </s-select>
          )}

          {selectedLine ? (
            <LineItemRow
              line={selectedLine}
              block={block}
              showTitle={cartLines.length === 1}
            />
          ) : (
            <s-text appearance="subdued">No items in cart.</s-text>
          )}
        </s-stack>
      </s-box>
    </s-stack>
  );
};

const LineItemRow = ({ line, block, showTitle }) => {
  const [productDetails, setProductDetails] = useState(null);
  const [updating, setUpdating] = useState(false);

  const productId = line.merchandise?.product?.id;
  const variantId = line.merchandise?.id;

  useEffect(() => {
    if (!shopify?.query || !productId) return;

    async function fetchProduct() {
      try {
        const res = await shopify.query(`
          query GetProduct($id: ID!) {
            product(id: $id) {
              variants(first: 50) {
                nodes {
                  id
                  title
                  price { amount currencyCode }
                }
              }
              sellingPlanGroups(first: 5) {
                nodes {
                  sellingPlans(first: 20) {
                    nodes {
                      id
                      name
                      description
                    }
                  }
                }
              }
            }
          }
        `, { variables: { id: productId } });
        
        if (res.data?.product) {
          setProductDetails(res.data.product);
        }
      } catch (e) {
        console.warn('[CheckoutExt] Error fetching variants:', e);
      }
    }

    fetchProduct();
  }, [productId]);

  const [selectedVariantId, setSelectedVariantId] = useState(variantId);
  const [selectedSellingPlanId, setSelectedSellingPlanId] = useState(line.sellingPlanAllocation?.sellingPlan?.id || '');
  const [selectedQuantity, setSelectedQuantity] = useState(String(line.quantity));

  useEffect(() => {
    setSelectedVariantId(variantId);
  }, [variantId]);

  useEffect(() => {
    setSelectedSellingPlanId(line.sellingPlanAllocation?.sellingPlan?.id || '');
  }, [line.sellingPlanAllocation?.sellingPlan?.id]);

  useEffect(() => {
    setSelectedQuantity(String(line.quantity));
  }, [line.quantity]);

  const applyChange = useCallback(async (change, errorMsg) => {
    setUpdating(true);
    try {
      const result = await shopify.applyCartLinesChange(change);
      if (result.type === 'error') {
        console.error(`[CheckoutExt] ${errorMsg}:`, result.message);
      }
    } catch (e) {
      console.warn('[CheckoutExt] applyCartLinesChange error:', e);
    } finally {
      setUpdating(false);
    }
  }, []);

  const handleUpdate = useCallback((changes) => {
    return applyChange({
      type: 'updateCartLine',
      id: line.id,
      ...changes
    }, 'Update line failed');
  }, [line.id, applyChange]);

  const handleRemove = useCallback(() => {
    return applyChange({
      type: 'removeCartLine',
      id: line.id,
      quantity: line.quantity
    }, 'Remove failed');
  }, [line.id, line.quantity, applyChange]);

  const variants = productDetails?.variants?.nodes || [];
  const sellingPlans = productDetails?.sellingPlanGroups?.nodes?.flatMap(g => g.sellingPlans?.nodes || []) || [];

  const [expanded, setExpanded] = useState(!!block.showActionsExpanded);

  return (
    <s-stack direction="block" gap="small">
      {showTitle ? (
        <s-grid gridTemplateColumns="1fr auto" alignItems="center">
          <s-stack direction="block" gap="none">
            <s-text type="strong">{line.merchandise?.product?.title}</s-text>
            <s-text size="small" appearance="subdued">{line.merchandise?.title}</s-text>
          </s-stack>
          <s-text type="strong">Qty: {line.quantity}</s-text>
        </s-grid>
      ) : (
        <s-grid gridTemplateColumns="1fr auto" alignItems="center">
          <s-text appearance="subdued">Edit details for selected item:</s-text>
          <s-text type="strong">Qty: {line.quantity}</s-text>
        </s-grid>
      )}

      {!block.showActionsExpanded && (
        <s-button variant="tertiary" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide editing options' : 'Edit details'}
        </s-button>
      )}

      {expanded && (
        <s-stack direction="block" gap="base">
          <s-divider />
          
          {block.variantSelector && variants.length > 1 && (
            <s-select
              label="Variant"
              value={selectedVariantId}
              disabled={updating || undefined}
              onChange={e => {
                const val = e.target.value || e.detail?.value || '';
                if (val) {
                  setSelectedVariantId(val);
                  handleUpdate({ merchandiseId: val });
                }
              }}
            >
              {variants.map(v => (
                <s-option key={v.id} value={v.id}>
                  {v.title} - {v.price?.amount} {v.price?.currencyCode}
                </s-option>
              ))}
            </s-select>
          )}

          {block.subscriptionSelector && sellingPlans.length > 0 && (
            <s-select
              label="Frequency"
              value={selectedSellingPlanId}
              disabled={updating || undefined}
              onChange={e => {
                const val = e.target.value || e.detail?.value || '';
                setSelectedSellingPlanId(val);
                handleUpdate({ sellingPlanId: val || undefined });
              }}
            >
              <s-option value="">One-time purchase</s-option>
              {sellingPlans.map(p => (
                <s-option key={p.id} value={p.id}>{p.name}</s-option>
              ))}
            </s-select>
          )}

          {block.quantity && (
            <s-select
              label="Quantity"
              value={selectedQuantity}
              disabled={updating || undefined}
              onChange={e => {
                const val = e.target.value || e.detail?.value || '';
                if (val) {
                  setSelectedQuantity(val);
                  handleUpdate({ quantity: Number(val) });
                }
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(qty => (
                <s-option key={qty} value={String(qty)}>{String(qty)}</s-option>
              ))}
            </s-select>
          )}

          {block.removeButton && (
            <s-button
              variant="tertiary"
              tone="critical"
              loading={updating || undefined}
              onClick={handleRemove}
            >
              Remove item
            </s-button>
          )}
        </s-stack>
      )}
    </s-stack>
  );
};
