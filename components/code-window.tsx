"use client"

import { useState, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeWindowProps {
  title: string
  icon: ReactNode
  content: string
  accent?: "teal" | "purple"
  copyable?: boolean
  placeholder: string
}

// Render inline emphasis: **bold** / ***bold*** -> high-contrast accent text.
function renderInline(text: string, accentClass: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Match 2-3 asterisk wrapped spans, or `inline code`.
  const regex = /(\*{2,3})(.+?)\1|`([^`]+)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    if (match[2] !== undefined) {
      nodes.push(
        <span key={key++} className={cn("font-semibold", accentClass)}>
          {match[2]}
        </span>,
      )
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={key++} className="rounded bg-secondary px-1 py-0.5 text-foreground">
          {match[3]}
        </code>,
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

// Convert streamed markdown-ish text into clean, spaced, bulleted lines.
function FormattedContent({ content, accentClass }: { content: string; accentClass: string }) {
  const lines = content.split("\n")
  return (
    <div className="space-y-1.5">
      {lines.map((raw, i) => {
        const line = raw.trimEnd()
        const trimmed = line.trim()

        // Skip stray horizontal-rule / triple-asterisk separators.
        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
          return <div key={i} className="my-2 border-t border-border/60" />
        }

        // Blank line -> vertical spacing.
        if (trimmed === "") return <div key={i} className="h-2" aria-hidden="true" />

        // Headers (#, ##, ###).
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
        if (headerMatch) {
          return (
            <p key={i} className={cn("mt-2 text-xs font-bold uppercase tracking-wider", accentClass)}>
              {renderInline(headerMatch[2], accentClass)}
            </p>
          )
        }

        // Bullets (-, *, •) with sharp custom marker and hanging indent.
        const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/)
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2.5">
              <span className={cn("mt-[0.45em] size-1.5 shrink-0 rotate-45", accentClass)} aria-hidden="true">
                <span className="block size-full bg-current" />
              </span>
              <p className="flex-1">{renderInline(bulletMatch[1], accentClass)}</p>
            </div>
          )
        }

        // Numbered list items keep their marker but get accent contrast.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2.5">
              <span className={cn("shrink-0 font-semibold tabular-nums", accentClass)}>{numMatch[1]}.</span>
              <p className="flex-1">{renderInline(numMatch[2], accentClass)}</p>
            </div>
          )
        }

        return (
          <p key={i} className="break-words">
            {renderInline(line, accentClass)}
          </p>
        )
      })}
    </div>
  )
}

export function CodeWindow({
  title,
  icon,
  content,
  accent = "teal",
  copyable = false,
  placeholder,
}: CodeWindowProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const accentText = accent === "teal" ? "text-primary" : "text-accent"
  const accentGlow = accent === "teal" ? "shadow-glow-teal" : "shadow-glow-purple"

  return (
    <div className={cn("glass flex h-full flex-col overflow-hidden rounded-xl border border-border", accentGlow)}>
      
      {/* HEADER BLOCK: Switch to items-start & gap-3 for responsive multi-line spacing */}
      <div className="flex items-start justify-between p-3 border-b border-border bg-secondary/40 gap-3">
        
        {/* Left Section: Drops alignment down from center so elements track with line 1 of titles */}
        <div className="flex items-start min-w-0 flex-1 gap-2.5">
          <div className="flex gap-1.5 flex-shrink-0 mt-1" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-chart-4/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
          </div>
          
          <span className={cn("inline-flex shrink-0 mt-0.5", accentText)} aria-hidden="true">
            {icon}
          </span>
          
          {/* Swapped out 'truncate' for responsive text-wrapping wrappers */}
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground break-words text-pretty leading-normal">
            {title}
          </h3>
        </div>

        {/* Right Section: Copy button safely locked along the top right perimeter */}
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            disabled={!content}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] font-medium transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 mt-0.5",
              copied ? "text-success border-success/40 bg-success/5" : "text-muted-foreground",
            )}
          >
            {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      <div
        className={cn(
          "relative max-h-[550px] flex-1 overflow-auto bg-[#0c0c0c] p-4 font-mono text-[13px] leading-relaxed text-foreground/90 cyber-scroll",
          accent === "purple" && "cyber-scroll-purple",
        )}
      >
        {content ? (
          <FormattedContent content={content} accentClass={accentText} />
        ) : (
          <span className="text-muted-foreground/50">{placeholder}</span>
        )}
      </div>
    </div>
  )
}