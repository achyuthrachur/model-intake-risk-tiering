"use client"

import * as React from "react"
import { HelpCircle, Info, X } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"
import { cn } from "@/lib/utils"

interface HelpTooltipProps {
  content: string | React.ReactNode
  title?: string
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  iconClassName?: string
  variant?: "help" | "info"
  maxWidth?: string
}

export function HelpTooltip({
  content,
  title,
  side = "top",
  className,
  iconClassName,
  variant = "help",
  maxWidth = "320px",
}: HelpTooltipProps) {
  const Icon = variant === "help" ? HelpCircle : Info

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
              className
            )}
            aria-label="Help information"
          >
            <Icon className={cn("w-4 h-4", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="bg-gray-900 text-white border-gray-800"
          style={{ maxWidth }}
        >
          {title && (
            <div className="font-semibold text-gray-100 mb-1">{title}</div>
          )}
          <div className="text-gray-200 text-sm leading-relaxed">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface HelpPopoverProps {
  title: string
  content: string | React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export function HelpPopover({
  title,
  content,
  children,
  side = "top",
}: HelpPopoverProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className="bg-gray-900 text-white border-gray-800 max-w-sm"
        >
          <div className="font-semibold text-gray-100 mb-1">{title}</div>
          <div className="text-gray-200 text-sm leading-relaxed">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Inline help that appears next to labels
interface InlineHelpProps {
  children: React.ReactNode
  help: string
  title?: string
}

export function InlineHelp({ children, help, title }: InlineHelpProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <HelpTooltip content={help} title={title} />
    </span>
  )
}

// Dismissible help card for first-time users
interface HelpCardProps {
  id: string // Unique ID for localStorage dismissal tracking
  title: string
  content: string | React.ReactNode
  icon?: React.ReactNode
  variant?: "info" | "tip" | "warning"
  className?: string
  dismissible?: boolean
}

export function HelpCard({
  id,
  title,
  content,
  icon,
  variant = "info",
  className,
  dismissible = true,
}: HelpCardProps) {
  const [dismissed, setDismissed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const isDismissed = localStorage.getItem(`help-dismissed-${id}`)
    if (isDismissed) setDismissed(true)
  }, [id])

  const handleDismiss = () => {
    localStorage.setItem(`help-dismissed-${id}`, "true")
    setDismissed(true)
  }

  if (!mounted || dismissed) return null

  const variantStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    tip: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  }

  const iconColors = {
    info: "text-blue-500",
    tip: "text-green-500",
    warning: "text-amber-500",
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className={iconColors[variant]}>{icon}</div>
        ) : (
          <Info className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColors[variant])} />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium mb-1">{title}</h4>
          <div className="text-sm opacity-90">{content}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Section help header with optional expandable details
interface SectionHelpProps {
  title: string
  description: string
  learnMore?: string
  className?: string
}

export function SectionHelp({
  title,
  description,
  learnMore,
  className,
}: SectionHelpProps) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className={cn("mb-4", className)}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      {learnMore && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:underline mt-1"
          >
            {expanded ? "Show less" : "Learn more"}
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              {learnMore}
            </div>
          )}
        </>
      )}
    </div>
  )
}
