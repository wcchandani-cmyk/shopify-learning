import { useRef } from "react";

const BenefitsList = ({ benefits = [], onChange }) => {
  const add = () => onChange([...benefits, ""]);
  const upd = (i, v) => onChange(benefits.map((b, idx) => (idx === i ? v : b)));
  const remove = (i) => onChange(benefits.filter((_, idx) => idx !== i));

  return (
    <s-stack gap="tight">
      <s-text type="strong">Benefits</s-text>
      {benefits.map((b, i) => (
        <s-stack key={i} direction="inline" gap="base" alignItems="end">
          <s-box grow="1">
            <s-text-field
              label="Benefit"
              labelAccessibilityVisibility="exclusive"
              placeholder="Benefit text"
              value={b}
              onInput={(e) => upd(i, e.target.value)}
            />
          </s-box>
          <s-button
            variant="tertiary"
            tone="critical"
            icon="delete"
            accessibilityLabel="Remove"
            onClick={() => remove(i)}
          />
        </s-stack>
      ))}
      <div>
        <s-button variant="tertiary" icon="plus-circle" onClick={add}>
          Add benefit
        </s-button>
      </div>
    </s-stack>
  );
};

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
      <s-grid gridTemplateColumns="1fr 1fr" gap="base">
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
      </s-grid>
    );

  if (type === "divider")
    return (
      <s-text tone="subdued">
        A horizontal divider line. No configuration needed.
      </s-text>
    );

  if (type === "heading")
    return (
      <s-grid gridTemplateColumns="1fr 1fr" gap="base">
        <s-text-field
          label="Heading text"
          value={item.headingText}
          onInput={(event) => upd("headingText", event.target.value)}
        />
        <s-select
          label="Level"
          value={item.headingLevel}
          onChange={(event) => upd("headingLevel", event.target.value)}
        >
          {["h1", "h2", "h3", "h4", "h5", "h6"].map((headerTag) => (
            <s-option key={headerTag} value={headerTag}>
              {headerTag.toUpperCase()}
            </s-option>
          ))}
        </s-select>
      </s-grid>
    );

  if (type === "image") {
    const handleFileChange = (event) => {
      const file = event.target.files?.[0];
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
                  <s-button
                    variant="tertiary"
                    tone="critical"
                    icon="x"
                    accessibilityLabel="Remove image"
                    onClick={() => upd("imageUrl", "")}
                  />
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

              {/* Hidden file input — no Polaris equivalent */}
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
          onInput={(event) => upd("imageAlt", event.target.value)}
        />
      </s-stack>
    );
  }

  if (type === "spacer")
    return (
      <s-select
        label="Size"
        value={item.spacerSize}
        onChange={(event) => upd("spacerSize", event.target.value)}
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
        onInput={(event) => upd("textContent", event.target.value)}
      />
    );

  return null;
};

export default ContentBody;
