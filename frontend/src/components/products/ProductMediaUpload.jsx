import { useRef } from "react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ProductMediaUpload({
  title,
  images = [],
  onImagesChange,
  onError,
  maxImages = Infinity,
}) {
  const fileInputRef = useRef(null);
  const allowMultiple = maxImages > 1;
  const canAddMore = images.length < maxImages;

  const readFile = (file) =>
    new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        onError?.("Only image files are allowed");
        resolve(null);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        onError?.("Image must be under 5MB");
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          url: reader.result,
          alt: file.name.replace(/\.[^.]+$/, "") || title || "",
        });
      reader.onerror = () => {
        onError?.("Could not read image");
        resolve(null);
      };
      reader.readAsDataURL(file);
    });

  const handleFileInput = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const room = maxImages - images.length;
    const selected = files.slice(0, Math.max(room, 0));
    const read = await Promise.all(selected.map(readFile));
    const valid = read.filter(Boolean);
    if (valid.length) {
      onImagesChange([...images, ...valid].slice(0, maxImages));
    }
  };

  const removeImage = (index) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="product-media-upload">
      <s-stack direction="inline" gap="small" alignItems="start">
        {images.map((image, index) => (
          <div
            key={`${image.url?.slice(0, 32) || "img"}-${index}`}
            className="product-media-upload__item"
          >
            <s-box
              border="base"
              borderRadius="base"
              overflow="hidden"
              inlineSize="104px"
              blockSize="104px"
            >
              <s-image
                objectFit="cover"
                src={image.url}
                alt={image.alt || title}
              />
            </s-box>
            <button
              type="button"
              className="product-media-upload__remove"
              aria-label="Remove image"
              onClick={() => removeImage(index)}
            >
              ×
            </button>
          </div>
        ))}

        {canAddMore ? (
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
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          {...(allowMultiple ? { multiple: true } : {})}
          hidden
          onChange={handleFileInput}
        />
      </s-stack>
    </div>
  );
}
