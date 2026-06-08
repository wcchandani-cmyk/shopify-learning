import { serializeProductOptions } from "./productVariants";

export const EMPTY_PRODUCT = {
  id: null,
  title: "",
  bodyHtml: "",
  vendor: "",
  productType: "",
  categoryId: "",
  categoryName: "",
  handle: "",
  tags: "",
  status: "draft",
  imageUrl: "",
  imageAlt: "",
  imagesJson: null,
  templateSuffix: "",
  variants: [],
  availableProductTypes: [],
};

/** Build the gallery array ({ url, alt }) the UI works with from a product. */
export function parseProductImages(product) {
  if (product?.imagesJson) {
    try {
      const parsed = JSON.parse(product.imagesJson);
      if (Array.isArray(parsed)) {
        const list = parsed
          .map((img) => ({ url: img?.src || img?.url || "", alt: img?.alt || "" }))
          .filter((img) => img.url);
        if (list.length) return list;
      }
    } catch {
      // fall through to single-image fallback
    }
  }

  if (product?.imageUrl) {
    return [{ url: product.imageUrl, alt: product.imageAlt || "" }];
  }

  return [];
}

export function productToFormState(product) {
  const images = parseProductImages(product);
  return {
    title: product.title || "",
    bodyHtml: product.bodyHtml || "",
    vendor: product.vendor || "",
    productType: product.productType || "",
    categoryId: product.categoryId || "",
    categoryName: product.categoryName || "",
    handle: product.handle || "",
    tags: product.tags || "",
    status: product.status || "draft",
    images,
    imageUrl: images[0]?.url || product.imageUrl || "",
    imageAlt: images[0]?.alt || product.imageAlt || "",
    templateSuffix: product.templateSuffix || "",
  };
}

export function variantsToFormState(variants = []) {
  return variants.map((variant) => ({
    id: variant.id,
    clientId: variant.clientId || null,
    isNew: Boolean(variant.isNew),
    title: variant.title || "",
    sku: variant.sku || "",
    price: variant.price != null ? String(variant.price) : "",
    inventoryQuantity:
      variant.inventoryQuantity != null
        ? String(variant.inventoryQuantity)
        : "0",
    option1: variant.option1 || "",
    option2: variant.option2 || "",
    option3: variant.option3 || "",
  }));
}

export function snapshotFormState(form, variants, options = []) {
  return JSON.stringify({
    form: { ...form },
    variants: variants.map((variant) => ({ ...variant })),
    options: options.map((option) => ({ ...option, values: [...(option.values || [])] })),
  });
}

/** Convert one UI image ({ url, alt }) into the API image shape. */
function toPayloadImage(image) {
  const url = image?.url || "";
  const alt = image?.alt?.trim() || null;

  if (/^https?:\/\//i.test(url)) {
    return { src: url, alt };
  }

  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/s);
    if (match) {
      const mime = match[1];
      const ext = (mime.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "") || "png";
      return {
        attachment: { data: match[2], filename: `product.${ext}` },
        alt,
      };
    }
  }

  return null;
}

export function buildUpdatePayload(form, variants, options = null) {
  const images = (form.images || []).map(toPayloadImage).filter(Boolean);
  const featured = (form.images || [])[0];

  const payload = {
    title: form.title.trim(),
    bodyHtml: form.bodyHtml || "",
    vendor: form.vendor.trim() || null,
    productType: form.productType.trim() || null,
    categoryId: form.categoryId?.trim() || null,
    categoryName: form.categoryName?.trim() || null,
    handle: form.handle.trim() || null,
    tags: form.tags.trim() || null,
    status: form.status,
    images,
    imageAlt: featured?.alt?.trim() || null,
    imageUrl: /^https?:\/\//i.test(featured?.url || "") ? featured.url : null,
    templateSuffix: form.templateSuffix.trim() || null,
  };

  if (options != null) {
    payload.optionsJson = serializeProductOptions(options);
  }

  payload.variants = variants.map((variant) => {
    const row = {
      title: variant.title.trim() || null,
      sku: variant.sku.trim() || null,
      price: variant.price.trim() || null,
      inventoryQuantity: parseInt(variant.inventoryQuantity, 10) || 0,
      option1: variant.option1?.trim() || null,
      option2: variant.option2?.trim() || null,
      option3: variant.option3?.trim() || null,
    };

    if (variant.isNew) {
      return { ...row, isNew: true, clientId: variant.clientId };
    }

    return { ...row, id: variant.id };
  });

  return payload;
}
