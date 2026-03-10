/**
 * Renders blog content from Markdown-like format to HTML
 * Supports: **bold**, *italic*, <u>underline</u>, lists, links
 */
export function renderBlogContent(content) {
  if (!content) return "";

  let html = content;

  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert *italic* to <em> (but not if it's part of **bold**)
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>");

  // Convert links [text](url) to <a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-red-500 hover:text-red-600 underline">$1</a>');

  // Process lists line by line
  const lines = html.split("\n");
  const processedLines = [];
  let inBulletList = false;
  let inNumberedList = false;
  let bulletItems = [];
  let numberedItems = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for bullet list
    if (line.match(/^-\s+/)) {
      if (inNumberedList) {
        // Close numbered list
        processedLines.push(`<ol class="list-decimal list-inside my-4 space-y-2">${numberedItems.join("")}</ol>`);
        numberedItems = [];
        inNumberedList = false;
      }
      if (!inBulletList) {
        inBulletList = true;
      }
      const itemText = line.replace(/^-\s+/, "");
      bulletItems.push(`<li>${itemText}</li>`);
      continue;
    }

    // Check for numbered list
    if (line.match(/^\d+\.\s+/)) {
      if (inBulletList) {
        // Close bullet list
        processedLines.push(`<ul class="list-disc list-inside my-4 space-y-2">${bulletItems.join("")}</ul>`);
        bulletItems = [];
        inBulletList = false;
      }
      if (!inNumberedList) {
        inNumberedList = true;
      }
      const itemText = line.replace(/^\d+\.\s+/, "");
      numberedItems.push(`<li>${itemText}</li>`);
      continue;
    }

    // Not a list item - close any open lists
    if (inBulletList) {
      processedLines.push(`<ul class="list-disc list-inside my-4 space-y-2">${bulletItems.join("")}</ul>`);
      bulletItems = [];
      inBulletList = false;
    }
    if (inNumberedList) {
      processedLines.push(`<ol class="list-decimal list-inside my-4 space-y-2">${numberedItems.join("")}</ol>`);
      numberedItems = [];
      inNumberedList = false;
    }

    // Add regular line
    if (line) {
      processedLines.push(line);
    }
  }

  // Close any remaining lists
  if (inBulletList) {
    processedLines.push(`<ul class="list-disc list-inside my-4 space-y-2">${bulletItems.join("")}</ul>`);
  }
  if (inNumberedList) {
    processedLines.push(`<ol class="list-decimal list-inside my-4 space-y-2">${numberedItems.join("")}</ol>`);
  }

  html = processedLines.join("\n");

  // Convert paragraphs (double line breaks)
  html = html.split("\n\n").map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    
    // If it's already HTML (starts with <), return as is
    if (trimmed.startsWith("<")) {
      return block;
    }
    
    // Otherwise wrap in <p>
    return `<p class="mb-4 leading-relaxed">${block.replace(/\n/g, "<br>")}</p>`;
  }).join("");

  return html;
}
