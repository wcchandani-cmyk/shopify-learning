// @ts-nocheck
import { useState, useEffect } from 'preact/hooks';

export const useCheckoutData = () => {
  const [cartLines, setCartLines] = useState(shopify.lines?.value || []);
  const [totalAmount, setTotalAmount] = useState(shopify.cost?.totalAmount?.value || null);
  const [subtotalAmount, setSubtotalAmount] = useState(shopify.cost?.subtotalAmount?.value || null);
  const [shippingAddress, setShippingAddress] = useState(shopify.shippingAddress?.value || null);
  const [billingAddress, setBillingAddress] = useState(shopify.billingAddress?.value || null);
  const [buyerCustomer, setBuyerCustomer] = useState(shopify.buyerIdentity?.customer?.value || null);
  const [buyerEmail, setBuyerEmail] = useState(shopify.buyerIdentity?.email?.value || null);
  const [discountCodes, setDiscountCodes] = useState(shopify.discountCodes?.value || []);
  const [cartNote, setCartNote] = useState(shopify.note?.value || '');
  const [cartAttributes, setCartAttributes] = useState(shopify.attributes?.value || []);

  useEffect(() => {
    const unsubscribes = [];
    if (shopify.lines) unsubscribes.push(shopify.lines.subscribe(val => setCartLines(val || [])));
    if (shopify.cost?.totalAmount) unsubscribes.push(shopify.cost.totalAmount.subscribe(val => setTotalAmount(val)));
    if (shopify.cost?.subtotalAmount) unsubscribes.push(shopify.cost.subtotalAmount.subscribe(val => setSubtotalAmount(val)));
    if (shopify.shippingAddress) unsubscribes.push(shopify.shippingAddress.subscribe(val => setShippingAddress(val)));
    if (shopify.billingAddress) unsubscribes.push(shopify.billingAddress.subscribe(val => setBillingAddress(val)));
    if (shopify.buyerIdentity?.customer) unsubscribes.push(shopify.buyerIdentity.customer.subscribe(val => setBuyerCustomer(val)));
    if (shopify.buyerIdentity?.email) unsubscribes.push(shopify.buyerIdentity.email.subscribe(val => setBuyerEmail(val)));
    if (shopify.discountCodes) unsubscribes.push(shopify.discountCodes.subscribe(val => setDiscountCodes(val || [])));
    if (shopify.note) unsubscribes.push(shopify.note.subscribe(val => setCartNote(val || '')));
    if (shopify.attributes) unsubscribes.push(shopify.attributes.subscribe(val => setCartAttributes(val || [])));
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return {
    cartLines,
    totalAmount,
    subtotalAmount,
    shippingAddress,
    billingAddress,
    buyerIdentity: {
      customer: buyerCustomer,
      email: buyerEmail
    },
    discountCodes,
    cartNote,
    cartAttributes
  };
};
