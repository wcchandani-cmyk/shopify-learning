import { useRef } from "react";

const BenefitsList = ({ benefits = [], onChange }) => {
  const add = () => onChange([...benefits, ""]);
  const upd = (i, v) => onChange(benefits.map((b, idx) => (idx === i ? v : b)));
  const remove = (i) => onChange(benefits.filter((_, idx) => idx !== i));

  return (
    <div className="ccf-choice-list">
      <s-text type="strong">Benefits</s-text>
      {benefits.map((b, i) => (
        <div key={i} className="ccf-choice-row">
          <s-text-field
            label="Benefit"
            label-hidden
            placeholder="Benefit text"
            value={b}
            onInput={(e) => upd(i, e.target.value)}
          />
          <s-button
            variant="tertiary"
            tone="critical"
            icon="delete"
            accessibilityLabel="Remove"
            onClick={() => remove(i)}
          />
        </div>
      ))}
      <s-button variant="tertiary" icon="plus-circle" onClick={add}>
        Add benefit
      </s-button>
    </div>
  );
}

const ContentBody = ({ item, upd }) => {
  const { type } = item;
  const fileInputRef = useRef(null);

  if (type === "banner")
    return (
      <s-stack gap="base">
        <s-text-field
          label="Banner text"
          value={item.bannerText}
          onInput={(e) => upd("bannerText", e.target.value)}
        />
        <s-select
          label="Tone"
          value={item.bannerTone}
          onChange={(e) => upd("bannerTone", e.target.value)}
        >
          <s-option value="info">Info</s-option>
          <s-option value="success">Success</s-option>
          <s-option value="warning">Warning</s-option>
          <s-option value="critical">Critical</s-option>
        </s-select>
      </s-stack>
    );

  if (type === "benefits")
    return (
      <BenefitsList
        benefits={item.benefits}
        onChange={(b) => upd("benefits", b)}
      />
    );

  if (type === "button")
    return (
      <s-stack gap="base">
        <div className="ccf-two-col">
          <s-text-field
            label="Label"
            value={item.buttonLabel}
            onInput={(e) => upd("buttonLabel", e.target.value)}
          />
          <s-text-field
            label="URL"
            placeholder="https://"
            value={item.buttonUrl}
            onInput={(e) => upd("buttonUrl", e.target.value)}
          />
        </div>
      </s-stack>
    );

  if (type === "divider")
    return (
      <s-text tone="subdued">
        A horizontal divider line. No configuration needed.
      </s-text>
    );

  if (type === "heading")
    return (
      <s-stack gap="base">
        <div className="ccf-two-col">
          <s-text-field
            label="Heading text"
            value={item.headingText}
            onInput={(e) => upd("headingText", e.target.value)}
          />
          <s-select
            label="Level"
            value={item.headingLevel}
            onChange={(e) => upd("headingLevel", e.target.value)}
          >
            {["h1", "h2", "h3", "h4", "h5", "h6"].map((h) => (
              <s-option key={h} value={h}>
                {h.toUpperCase()}
              </s-option>
            ))}
          </s-select>
        </div>
      </s-stack>
    );

  if (type === "image") {
    const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        upd("imageUrl", reader.result);
      };
      reader.readAsDataURL(file);
    };

    return (
      <s-stack gap="base">
        <s-stack gap="extraTight">
          <s-text type="strong">Image</s-text>
          <div className="product-media-upload">
            <s-stack direction="inline" gap="small" alignItems="start">
              {item.imageUrl ? (
                <div className="product-media-upload__item">
                  <s-box
                    border="base"
                    borderRadius="base"
                    overflow="hidden"
                    inlineSize="104px"
                    blockSize="104px"
                  >
                    <s-image
                      objectFit="cover"
                      src={item.imageUrl}
                      alt={item.imageAlt || "Preview"}
                    />
                  </s-box>
                  <button
                    type="button"
                    className="product-media-upload__remove"
                    aria-label="Remove image"
                    onClick={() => upd("imageUrl", "")}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <s-clickable
                  accessibilityLabel="Add image"
                  border="base"
                  borderRadius="base"
                  borderStyle="dashed"
                  background="subdued"
                  inlineSize="104px"
                  blockSize="104px"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <s-stack alignItems="center" justifyContent="center" blockSize="100%">
                    <s-text type="strong">+</s-text>
                  </s-stack>
                </s-clickable>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </s-stack>
          </div>
        </s-stack>

        <s-text-field
          label="Alt text"
          value={item.imageAlt}
          onInput={(e) => upd("imageAlt", e.target.value)}
        />
      </s-stack>
    );
  }

  if (type === "spacer")
    return (
      <s-select
        label="Size"
        value={item.spacerSize}
        onChange={(e) => upd("spacerSize", e.target.value)}
      >
        <s-option value="small">Small</s-option>
        <s-option value="medium">Medium</s-option>
        <s-option value="large">Large</s-option>
      </s-select>
    );

  if (type === "text")
    return (
      <s-text-field
        label="Text content"
        value={item.textContent}
        multiline={3}
        onInput={(e) => upd("textContent", e.target.value)}
      />
    );

  return null;
};

export default ContentBody;
