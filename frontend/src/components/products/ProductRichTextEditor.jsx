import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["link", "image"],
  ["clean"],
];

function isEmptyHtml(html) {
  if (!html || !html.trim()) return true;
  const normalized = html.replace(/\s/g, "").toLowerCase();
  return (
    normalized === "" ||
    normalized === "<p><br></p>" ||
    normalized === "<p></p>"
  );
}

function setEditorHtml(quill, html) {
  if (isEmptyHtml(html)) {
    quill.setText("");
    return;
  }
  const delta = quill.clipboard.convert({ html });
  quill.setContents(delta, "silent");
}

export default function ProductRichTextEditor({
  value,
  onChange,
  placeholder = "",
}) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isExternalUpdate = useRef(false);

  onChangeRef.current = onChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || quillRef.current) return;

    const editorEl = document.createElement("div");
    container.appendChild(editorEl);

    const quill = new Quill(editorEl, {
      theme: "snow",
      modules: { toolbar: TOOLBAR },
      placeholder,
    });

    setEditorHtml(quill, value);

    const handleChange = () => {
      if (isExternalUpdate.current) return;
      onChangeRef.current(quill.root.innerHTML);
    };

    quill.on("text-change", handleChange);
    quillRef.current = quill;

    return () => {
      quill.off("text-change", handleChange);
      quillRef.current = null;
      container.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const empty = isEmptyHtml(value);
    if (empty && quill.editor.isBlank()) return;

    const currentHtml = quill.root.innerHTML;
    if (!empty && currentHtml === value) return;

    isExternalUpdate.current = true;
    setEditorHtml(quill, value);
    isExternalUpdate.current = false;
  }, [value]);

  return <div ref={containerRef} className="product-rich-text-editor" />;
}
