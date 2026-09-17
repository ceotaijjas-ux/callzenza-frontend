"use client";

import React from "react";

interface MarkdownTextProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

/**
 * Clean, lightweight markdown text renderer for AI Chatbot responses.
 * Formats **bold**, *italic*, `code`, bullet points, and headers without showing raw markdown syntax.
 */
export function MarkdownText({ content, className = "", isUser = false }: MarkdownTextProps) {
  if (!content) return null;

  // Split content by lines to process block elements (headers, lists, paragraphs)
  const lines = content.split("\n");

  const renderInline = (text: string): React.ReactNode[] => {
    // Regex matching **bold**, *italic*, and `code`
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Helper regex pattern for inline tokens: **bold**, `code`, *italic*
    const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    const splitTokens = text.split(tokenRegex);

    return splitTokens.map((segment, idx) => {
      if (!segment) return null;

      // Check **bold**
      if (segment.startsWith("**") && segment.endsWith("**") && segment.length > 4) {
        const inner = segment.slice(2, -2);
        return (
          <strong key={idx} className={isUser ? "font-bold text-white underline decoration-white/30" : "font-bold text-slate-900"}>
            {inner}
          </strong>
        );
      }

      // Check `code`
      if (segment.startsWith("`") && segment.endsWith("`") && segment.length > 2) {
        const inner = segment.slice(1, -1);
        return (
          <code key={idx} className={isUser ? "bg-indigo-700 text-indigo-100 px-1 py-0.5 rounded font-mono text-[0.88em]" : "bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-mono text-[0.88em]"}>
            {inner}
          </code>
        );
      }

      // Check *italic*
      if (segment.startsWith("*") && segment.endsWith("*") && segment.length > 2) {
        const inner = segment.slice(1, -1);
        return <em key={idx} className="italic">{inner}</em>;
      }

      return <span key={idx}>{segment}</span>;
    });
  };

  const renderedBlocks: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      renderedBlocks.push(
        <ul key={`ul-${renderedBlocks.length}`} className="list-disc list-inside my-1.5 space-y-0.5">
          {listItems}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Check header
    if (trimmed.startsWith("### ")) {
      flushList();
      renderedBlocks.push(
        <h4 key={lineIdx} className={isUser ? "font-bold text-sm text-white mt-2 mb-1" : "font-bold text-sm text-slate-900 mt-2 mb-1"}>
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      renderedBlocks.push(
        <h3 key={lineIdx} className={isUser ? "font-extrabold text-sm text-white mt-2.5 mb-1" : "font-extrabold text-sm text-slate-900 mt-2.5 mb-1"}>
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      renderedBlocks.push(
        <h2 key={lineIdx} className={isUser ? "font-extrabold text-base text-white mt-3 mb-1" : "font-extrabold text-base text-slate-900 mt-3 mb-1"}>
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Check bullet items (- or * or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      inList = true;
      listItems.push(
        <li key={lineIdx} className="ml-1 leading-relaxed">
          {renderInline(bulletMatch[1])}
        </li>
      );
      return;
    }

    // Check numbered list (1. 2. etc)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushList();
      renderedBlocks.push(
        <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 pl-1">
          <span className={isUser ? "font-bold text-indigo-200 text-[0.9em]" : "font-bold text-indigo-600 text-[0.9em]"}>
            {numMatch[1]}.
          </span>
          <span className="flex-1 leading-relaxed">{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Regular line
    flushList();

    if (trimmed === "") {
      renderedBlocks.push(<div key={lineIdx} className="h-1.5" />);
    } else {
      renderedBlocks.push(
        <p key={lineIdx} className="leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  });

  flushList();

  return <div className={`space-y-0.5 ${className}`}>{renderedBlocks}</div>;
}
