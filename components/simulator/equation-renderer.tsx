"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import type { Components } from "react-markdown"

interface EquationRendererProps {
  content: string
  showFrame?: boolean
  size?: "sm" | "md"
}

function getMdComponents(size: "sm" | "md"): Components {
  const textClass = size === "md" ? "text-sm leading-relaxed text-foreground/95" : "text-xs leading-relaxed text-foreground/90"
  const listClass = size === "md" ? "flex flex-col gap-1.5 text-sm" : "flex flex-col gap-1 text-xs"
  const codeClass = size === "md"
    ? "rounded-sm border border-primary/15 bg-primary/5 px-1.5 py-0.5 font-mono text-xs text-primary"
    : "rounded-sm border border-primary/15 bg-primary/5 px-1 py-0.5 font-mono text-[10px] text-primary"

  return {
  // Block-level math gets the full blueprint treatment
  p: ({ children, ...props }) => (
    <p className={textClass} {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-display font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="text-primary/80 not-italic font-medium" {...props}>
      {children}
    </em>
  ),
  ul: ({ children, ...props }) => (
    <ul className={listClass} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className={`${listClass} list-decimal list-inside`} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className={`${size === "md" ? "text-sm" : "text-xs"} flex items-start gap-2 text-foreground/90`} {...props}>
      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/50" />
      <span>{children}</span>
    </li>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code
          className={codeClass}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre
      className={`overflow-x-auto rounded-lg border border-border/50 bg-muted/50 p-3 font-mono ${size === "md" ? "text-xs" : "text-[10px]"}`}
      {...props}
    >
      {children}
    </pre>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="font-display text-sm font-bold text-foreground" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="font-display text-xs font-bold text-foreground" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="font-display text-xs font-semibold text-foreground/90" {...props}>{children}</h3>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-2 border-primary/30 pl-3 text-xs italic text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="border-border/50" {...props} />,
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-[10px]" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border-b border-border/50 bg-muted/50 px-2 py-1.5 text-left font-mono font-semibold uppercase tracking-wider text-muted-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-border/30 px-2 py-1.5 text-foreground/90" {...props}>
      {children}
    </td>
  ),
}
}

export function EquationRenderer({ content, showFrame = true, size = "sm" }: EquationRendererProps) {
  const mdComponents = getMdComponents(size)
  return (
    <div className="equation-renderer relative flex flex-col gap-3">
      {showFrame && (
        <>
          {/* Top-left corner bracket */}
          <div className="pointer-events-none absolute -left-2 -top-2 size-4">
            <svg viewBox="0 0 16 16" className="size-full text-primary/20">
              <path d="M 0 16 L 0 0 L 16 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          {/* Bottom-right corner bracket */}
          <div className="pointer-events-none absolute -bottom-2 -right-2 size-4">
            <svg viewBox="0 0 16 16" className="size-full text-primary/20">
              <path d="M 16 0 L 16 16 L 0 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={mdComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
