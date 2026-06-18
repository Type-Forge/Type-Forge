"use client"

import { useState } from "react"
import Key from "./Key"
import { playClickSound } from "@/lib/audio"

interface KeyDef {
  label: string
  subLabel?: string
  code: string
  flex?: string
}

interface KeyboardBodyProps {
  selectedKeys?: string[]
  onToggleKey?: (key: string) => void
  activeKey?: string | null
  wrongKey?: string | null
}

/**
 * KeyboardBody component representing a premium Apple Magic Keyboard style layout.
 * Distinguishes currently active typing targets (solid accent blue) from selected focus keys (white dot).
 */
export default function KeyboardBody({
  selectedKeys = [],
  onToggleKey,
  activeKey = null,
  wrongKey = null,
}: KeyboardBodyProps) {
  const [isMacLayout, setIsMacLayout] = useState(true)

  const fRow: KeyDef[] = [
    { label: "ESC", code: "Escape" },
    { label: "F1", code: "F1" },
    { label: "F2", code: "F2" },
    { label: "F3", code: "F3" },
    { label: "F4", code: "F4" },
    { label: "F5", code: "F5" },
    { label: "F6", code: "F6" },
    { label: "F7", code: "F7" },
    { label: "F8", code: "F8" },
    { label: "F9", code: "F9" },
    { label: "F10", code: "F10" },
    { label: "F11", code: "F11" },
    { label: "F12", code: "F12" },
  ]

  const numberRow: KeyDef[] = [
    { label: "`", subLabel: "~", code: "Backquote" },
    { label: "1", subLabel: "!", code: "Digit1" },
    { label: "2", subLabel: "@", code: "Digit2" },
    { label: "3", subLabel: "#", code: "Digit3" },
    { label: "4", subLabel: "$", code: "Digit4" },
    { label: "5", subLabel: "%", code: "Digit5" },
    { label: "6", subLabel: "^", code: "Digit6" },
    { label: "7", subLabel: "&", code: "Digit7" },
    { label: "8", subLabel: "*", code: "Digit8" },
    { label: "9", subLabel: "(", code: "Digit9" },
    { label: "0", subLabel: ")", code: "Digit0" },
    { label: "-", subLabel: "_", code: "Minus" },
    { label: "=", subLabel: "+", code: "Equal" },
    { label: "delete", code: "Backspace", flex: "flex-[1.6]" },
  ]

  const qwertyRow: KeyDef[] = [
    { label: "tab", code: "Tab", flex: "flex-[1.6]" },
    { label: "q", code: "KeyQ" },
    { label: "w", code: "KeyW" },
    { label: "e", code: "KeyE" },
    { label: "r", code: "KeyR" },
    { label: "t", code: "KeyT" },
    { label: "y", code: "KeyY" },
    { label: "u", code: "KeyU" },
    { label: "i", code: "KeyI" },
    { label: "o", code: "KeyO" },
    { label: "p", code: "KeyP" },
    { label: "[", subLabel: "{", code: "BracketLeft" },
    { label: "]", subLabel: "}", code: "BracketRight" },
    { label: "\\", subLabel: "|", code: "Backslash", flex: "flex-[1.2]" },
  ]

  const homeRow: KeyDef[] = [
    { label: "caps lock", code: "CapsLock", flex: "flex-[1.9]" },
    { label: "a", code: "KeyA" },
    { label: "s", code: "KeyS" },
    { label: "d", code: "KeyD" },
    { label: "f", code: "KeyF" },
    { label: "g", code: "KeyG" },
    { label: "h", code: "KeyH" },
    { label: "j", code: "KeyJ" },
    { label: "k", code: "KeyK" },
    { label: "l", code: "KeyL" },
    { label: ";", subLabel: ":", code: "Semicolon" },
    { label: "'", subLabel: "\"", code: "Quote" },
    { label: isMacLayout ? "return" : "enter", code: "Enter", flex: "flex-[1.9]" },
  ]

  const shiftRow: KeyDef[] = [
    { label: "shift", code: "ShiftLeft", flex: "flex-[2.5]" },
    { label: "z", code: "KeyZ" },
    { label: "x", code: "KeyX" },
    { label: "c", code: "KeyC" },
    { label: "v", code: "KeyV" },
    { label: "b", code: "KeyB" },
    { label: "n", code: "KeyN" },
    { label: "m", code: "KeyM" },
    { label: ",", subLabel: "<", code: "Comma" },
    { label: ".", subLabel: ">", code: "Period" },
    { label: "/", subLabel: "?", code: "Slash" },
    { label: "shift", code: "ShiftRight", flex: "flex-[2.5]" },
  ]

  const bottomRow: KeyDef[] = isMacLayout
    ? [
        { label: "fn", code: "Fn" },
        { label: "control", code: "ControlLeft" },
        { label: "option", code: "AltLeft", flex: "flex-[1.2]" },
        { label: "command", code: "MetaLeft", flex: "flex-[1.4]" },
        { label: " ", code: "Space", flex: "flex-[5.5]" },
        { label: "command", code: "MetaRight", flex: "flex-[1.4]" },
        { label: "option", code: "AltRight", flex: "flex-[1.2]" },
        { label: "◀", code: "ArrowLeft" },
        { label: "up-down", code: "ArrowUpDown" },
        { label: "▶", code: "ArrowRight" },
      ]
    : [
        { label: "ctrl", code: "ControlLeft", flex: "flex-[1.2]" },
        { label: "win", code: "MetaLeft", flex: "flex-[1.2]" },
        { label: "alt", code: "AltLeft", flex: "flex-[1.2]" },
        { label: " ", code: "Space", flex: "flex-[6]" },
        { label: "alt", code: "AltRight", flex: "flex-[1.2]" },
        { label: "win", code: "MetaRight", flex: "flex-[1.2]" },
        { label: "ctrl", code: "ControlRight", flex: "flex-[1.2]" },
        { label: "◀", code: "ArrowLeft" },
        { label: "up-down", code: "ArrowUpDown" },
        { label: "▶", code: "ArrowRight" },
      ]

  // Key status mapping: activeKey (currently prompted) is solid accent blue, wrongKey is red.
  const getKeyStatus = (keyLabel: string, keyCode: string) => {
    const normalizedKey = keyLabel.toLowerCase()
    const activeCode = activeKey?.toLowerCase()
    const wrongCode = wrongKey?.toLowerCase()

    if (activeKey === keyLabel || activeCode === keyCode.toLowerCase() || activeCode === normalizedKey) {
      return "active"
    }
    if (wrongKey === keyLabel || wrongCode === keyCode.toLowerCase() || wrongCode === normalizedKey) {
      return "incorrect"
    }
    return "default"
  }

  // Selected focus keys display a white dot on the keycap.
  const isKeyFocused = (keyLabel: string, keyCode: string) => {
    const isLetter = keyLabel.length === 1 && /^[a-z]$/.test(keyLabel)
    const normalizedKey = keyLabel.toLowerCase()
    return isLetter && selectedKeys.includes(normalizedKey)
  }

  const handleKeyClick = (keyLabel: string) => {
    playClickSound(keyLabel)
    const isLetter = keyLabel.length === 1 && /^[a-z]$/.test(keyLabel)
    if (isLetter && onToggleKey) {
      onToggleKey(keyLabel)
    }
  }

  const renderRow = (row: KeyDef[], heightClass?: string) => (
    <div className="flex gap-[3px] w-full">
      {row.map((k) => (
        <Key
          key={k.code}
          code={k.code}
          label={k.label}
          subLabel={k.subLabel}
          status={getKeyStatus(k.label, k.code)}
          isFocusKey={isKeyFocused(k.label, k.code)}
          widthClass={k.flex || "flex-1"}
          heightClass={heightClass || "h-9 sm:h-10"}
          isMacLayout={isMacLayout}
          onClick={() => handleKeyClick(k.label)}
        />
      ))}
    </div>
  )

  return (
    <div className="w-full rounded-[20px] bg-surface-secondary/50 border border-border/10 p-3 sm:p-4 shadow-sm flex flex-col gap-[3px] select-none font-sans">
      {/* OS Layout Switcher */}
      <div className="flex justify-between items-center w-full mb-2 px-0.5">
        <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">
          Focus Keys Layout
        </span>
        <div className="bg-surface-secondary p-0.5 rounded-[8px] flex items-center justify-center gap-0.5 border border-border/10">
          <button
            onClick={() => { playClickSound("click"); setIsMacLayout(true) }}
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none ${
              isMacLayout
                ? "text-text-primary bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Mac
          </button>
          <button
            onClick={() => { playClickSound("click"); setIsMacLayout(false) }}
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none ${
              !isMacLayout
                ? "text-text-primary bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Windows
          </button>
        </div>
      </div>

      {/* Keyboard Rows */}
      <div className="flex flex-col gap-[3px] w-full">
        {/* F-Row */}
        {renderRow(fRow, "h-6 sm:h-7")}

        {/* Spacer between F-row and number row */}
        <div className="h-1" />

        {/* Number Row */}
        {renderRow(numberRow)}

        {/* QWERTY Row */}
        {renderRow(qwertyRow)}

        {/* Home Row */}
        {renderRow(homeRow)}

        {/* Shift Row */}
        {renderRow(shiftRow)}

        {/* Bottom Row - special arrow split */}
        <div className="flex gap-[3px] w-full">
          {bottomRow.map((k) => {
            if (k.label === "up-down") {
              return (
                <div key="ArrowUpDown" className="flex flex-col gap-[2px] justify-between h-9 sm:h-10 flex-1 min-w-0">
                  <Key
                    code="ArrowUp"
                    label="▲"
                    status={getKeyStatus("▲", "ArrowUp")}
                    isFocusKey={isKeyFocused("▲", "ArrowUp")}
                    widthClass="w-full"
                    heightClass="flex-1"
                    isMacLayout={isMacLayout}
                    onClick={() => handleKeyClick("▲")}
                  />
                  <Key
                    code="ArrowDown"
                    label="▼"
                    status={getKeyStatus("▼", "ArrowDown")}
                    isFocusKey={isKeyFocused("▼", "ArrowDown")}
                    widthClass="w-full"
                    heightClass="flex-1"
                    isMacLayout={isMacLayout}
                    onClick={() => handleKeyClick("▼")}
                  />
                </div>
              )
            }
            return (
              <Key
                key={k.code}
                code={k.code}
                label={k.label}
                status={getKeyStatus(k.label, k.code)}
                isFocusKey={isKeyFocused(k.label, k.code)}
                widthClass={k.flex || "flex-1"}
                isMacLayout={isMacLayout}
                onClick={() => handleKeyClick(k.label)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
