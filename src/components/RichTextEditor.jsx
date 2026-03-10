"use client";

import { useState, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from "lucide-react";

export default function RichTextEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const handleSelection = () => {
    if (textareaRef.current) {
      setSelection({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      });
    }
  };

  const insertText = (before, after = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const formatText = (format) => {
    const formats = {
      bold: ["**", "**"],
      italic: ["*", "*"],
      underline: ["<u>", "</u>"],
      link: ["[", "](url)"],
    };

    if (formats[format]) {
      insertText(formats[format][0], formats[format][1]);
    }
  };

  const formatList = (ordered = false) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const lines = value.substring(0, start).split("\n");
    const currentLine = lines.length - 1;
    const lineStart = value.substring(0, start).lastIndexOf("\n") + 1;
    const lineEnd = value.indexOf("\n", start);
    const lineText = value.substring(
      lineStart,
      lineEnd === -1 ? value.length : lineEnd
    );

    const prefix = ordered ? "1. " : "- ";
    const newLineText = prefix + lineText.trim();
    const newText =
      value.substring(0, lineStart) +
      newLineText +
      value.substring(lineEnd === -1 ? value.length : lineEnd);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = lineStart + newLineText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => formatText("bold")}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => formatText("italic")}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => formatText("underline")}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300"></div>
        <button
          type="button"
          onClick={() => formatList(false)}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => formatList(true)}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => formatText("link")}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Link"
        >
          <LinkIcon size={16} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelection}
        rows={12}
        className="w-full px-4 py-3 border-0 focus:ring-0 outline-none resize-none"
        placeholder="Write your blog content here... You can use Markdown-style formatting:
**bold**, *italic*, <u>underline</u>
- Bullet lists
1. Numbered lists
[Link text](url)"
      />

      {/* Preview Hint */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-500">
        Supports Markdown-style formatting. Content will be rendered as HTML on the blog page.
      </div>
    </div>
  );
}

