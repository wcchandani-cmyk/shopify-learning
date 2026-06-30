// @ts-nocheck
import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useCheckoutData } from '../../shared/useCheckoutData';

export default async () => {
  render(<Extension />, document.body)
};

const Extension = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsInfo, setProductsInfo] = useState({});
  const [addingId, setAddingId] = useState(null);

  const { cartLines } = useCheckoutData();

  useEffect(() => {
    async function loadCampaigns() {
      if (!shopify.query) {
        console.error("Storefront API access (shopify.query) is not available.");
        setLoading(false);
        return;
      }

      try {
        const res = await shopify.query(`
          query {
            metaobjects(type: "app--376206196737--checkout_upsell", first: 10) {
              nodes {
                id
                handle
                fields {
                  key
                  value
                }
              }
            }
          }
        `);

        console.log("Checkout Extension - Metaobjects query result:", res);

        const parsedCampaigns = [];
        const productIdsToFetch = new Set();

        const nodes = res.data?.metaobjects?.nodes || [];
        for (const node of nodes) {
          const configField = node.fields.find(f => f.key === 'upsell_config');
          if (configField) {
            try {
              const config = JSON.parse(configField.value);
              if (config.isActive) {
                parsedCampaigns.push(config);
                if (config.upsellProductId) {
                  productIdsToFetch.add(config.upsellProductId);
                }
              }
            } catch (e) {
              console.error("Failed to parse campaign config", e);
            }
          }
        }

        setCampaigns(parsedCampaigns);

        if (productIdsToFetch.size > 0) {
          const info = {};
          for (const prodId of productIdsToFetch) {
            const prodRes = await shopify.query(`
              query GetProduct($id: ID!) {
                product(id: $id) {
                  id
                  title
                  featuredImage {
                    url
                  }
                  variants(first: 1) {
                    nodes {
                      id
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            `, {
              variables: { id: prodId }
            });

            if (prodRes.data?.product) {
              info[prodId] = prodRes.data.product;
            }
          }
          setProductsInfo(info);
        }

      } catch (err) {
        console.error("Error loading campaigns or products", err);
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

  if (loading) {
    return null;
  }

  const activeOffer = campaigns.find(campaign => {
    const upsellId = String(campaign.upsellProductId || "").trim().toLowerCase();

    if (!upsellId) return false;

    const triggerProductIds = new Set();
    if (Array.isArray(campaign.triggerProductIds)) {
      campaign.triggerProductIds.forEach(id => {
        if (id) triggerProductIds.add(String(id).trim().toLowerCase());
      });
    }
    if (campaign.triggerProductId) {
      triggerProductIds.add(String(campaign.triggerProductId).trim().toLowerCase());
    }

    if (triggerProductIds.size === 0) return false;

    const hasTrigger = cartLines.some(line => {
      const prodId = line.merchandise?.product?.id;
      return prodId && triggerProductIds.has(String(prodId).toLowerCase());
    });

    const hasUpsell = cartLines.some(line => {
      const prodId = line.merchandise?.product?.id;
      return prodId && String(prodId).toLowerCase() === upsellId;
    });

    return hasTrigger && !hasUpsell;
  });

  if (!activeOffer) {
    return null;
  }

  const upsellProduct = productsInfo[activeOffer.upsellProductId];
  if (!upsellProduct) return null;

  const variant = upsellProduct.variants?.nodes?.[0];
  if (!variant) return null;

  const discountPercentage = Number(activeOffer.discountPercentage) || 0;
  const originalPrice = parseFloat(variant.price?.amount || "0");
  const currencyCode = variant.price?.currencyCode || "USD";
  const discountedPrice = originalPrice - (originalPrice * discountPercentage) / 100;
  const imageUrl = upsellProduct.featuredImage?.url;

  const handleAdd = async () => {
    setAddingId(variant.id);
    try {
      const result = await shopify.applyCartLinesChange({
        type: "addCartLine",
        merchandiseId: variant.id,
        quantity: 1,
      });

      if (result.type === 'error') {
        console.error("Failed to add line item", result.message);
      }
    } catch (err) {
      console.error("Error adding to cart", err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <s-banner heading={activeOffer.offerTitle || "Special Offer"}>
      <s-grid gridTemplateColumns="60px 1fr auto" alignItems="center" gap="base">
        {imageUrl && (
          <s-image
            src={imageUrl}
            alt={upsellProduct.title}
            aspectRatio={1}
            borderRadius="base"
            inlineSize="100%"
          />
        )}
        <s-stack gap="extraTight">
          <s-text type="strong">
            {upsellProduct.title}
          </s-text>
          <s-stack direction="inline" gap="tight">
            {discountPercentage > 0 ? (
              <>
                <s-text color="subdued" type="redundant">
                  {originalPrice.toFixed(2)} {currencyCode}
                </s-text>
                <s-text tone="success" type="strong">
                  {discountedPrice.toFixed(2)} {currencyCode} ({discountPercentage}% Off)
                </s-text>
              </>
            ) : (
              <s-text type="strong">
                {originalPrice.toFixed(2)} {currencyCode}
              </s-text>
            )}
          </s-stack>
        </s-stack>
        <s-button
          loading={addingId === variant.id || undefined}
          onClick={handleAdd}
        >
          Add
        </s-button>
      </s-grid>
    </s-banner>
  );
};