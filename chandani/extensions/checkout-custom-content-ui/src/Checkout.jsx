// @ts-nocheck
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { evaluateConditions } from '../../shared/conditions';
import { useCheckoutData } from '../../shared/useCheckoutData';

const BACKEND_URL = 'https://8crx9x5z-5000.inc1.devtunnels.ms';

export default async () => {
  render(<CheckoutExtension />, document.body);
};

const CheckoutExtension = () => {
  const [customContents, setCustomContents] = useState([]);
  const [loading, setLoading] = useState(true);

  const shopDomain = shopify?.shop?.myshopifyDomain || '';
  const checkoutData = useCheckoutData();

  useEffect(() => {
    async function load() {
      if (!shopDomain) return;
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/checkout-customizations/public?shop=${encodeURIComponent(shopDomain)}&type=custom_content`
        );
        if (res.ok) {
          const data = await res.json();
          const blocks = data?.data?.customizations || [];
          setCustomContents(blocks);
        }
      } catch (e) {
        console.warn('[CheckoutExt] Could not load custom contents:', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shopDomain]);

  if (loading) return null;

  const visibleBlocks = customContents.filter(block => {
    const result = evaluateConditions(block.displayRule, block.displayConditions, checkoutData);
    console.log('[CheckoutCustomContent] block:', block.internalName, 'displayRule:', block.displayRule, 'displayConditions:', block.displayConditions, 'result:', result, 'checkoutData:', checkoutData);
    return result;
  });

  if (visibleBlocks.length === 0) {
    console.log('[CheckoutCustomContent] No visible blocks.');
    return null;
  }

  return (
    <s-box padding={['none', 'none', 'base', 'none']}>
      <s-stack direction="block" gap="large">
        {visibleBlocks.map(block => (
          <CustomContentBlock key={block.id} block={block} />
        ))}
      </s-stack>
    </s-box>
  );
};

const CustomContentBlock = ({ block }) => {
  const contents = block.contents || [];

  return (
    <s-stack direction="block" gap="base">
      {block.heading && <s-heading level="2">{block.heading}</s-heading>}
      {block.subheading && <s-text appearance="subdued">{block.subheading}</s-text>}
      
      {contents.map((item, i) => (
        <ContentItemRenderer key={i} item={item} />
      ))}
    </s-stack>
  );
};

const ContentItemRenderer = ({ item }) => {
  const { type } = item;

  switch (type) {
    case 'banner':
      return (
        <s-banner heading={item.bannerText} tone={item.bannerTone || 'info'} />
      );

    case 'benefits': {
      const list = item.benefits || [];
      return (
        <s-stack direction="block" gap="small">
          {list.map((b, idx) => (
            <s-grid key={idx} gridTemplateColumns="auto 1fr" alignItems="center" gap="small">
              <s-text tone="success">✓</s-text>
              <s-text>{b}</s-text>
            </s-grid>
          ))}
        </s-stack>
      );
    }

    case 'button':
      return (
        <s-button href={item.buttonUrl || '#'} external>
          {item.buttonLabel || 'Click here'}
        </s-button>
      );

    case 'divider':
      return <s-divider />;

    case 'heading': {
      const lvl = String(item.headingLevel || 'h2').replace('h', '');
      return (
        <s-heading level={lvl || '2'}>
          {item.headingText}
        </s-heading>
      );
    }

    case 'image':
      return (
        <s-image
          src={item.imageUrl}
          alt={item.imageAlt || ''}
          aspectRatio={1}
          borderRadius="base"
        />
      );

    case 'spacer': {
      const pad = item.spacerSize === 'large' ? 'large' : item.spacerSize === 'medium' ? 'base' : 'small';
      return <s-box padding={pad}><s-text> </s-text></s-box>;
    }

    case 'text':
      return <s-text>{item.textContent}</s-text>;

    default:
      return null;
  }
};
