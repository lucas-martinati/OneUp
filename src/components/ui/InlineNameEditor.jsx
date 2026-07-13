import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pencil, Check } from '@utils/icons';
import { useBackHandler } from '@hooks/useBackHandler';
import styles from './InlineNameEditor.module.css';

const MAX_LENGTH = 60;
const WARN_THRESHOLD = 50;

/**
 * A centralized, reusable inline text editor for naming things (like sessions).
 * Handles its own edit state and bubbles up saves.
 *
 * @param {Object} props
 * @param {string} props.value - The current name
 * @param {Function} props.onSave - Async callback when user saves a new name
 * @param {string} props.placeholder - Text inside the input field
 * @param {string} props.emptyLabel - Text to show when value is empty and not editing
 * @param {Object} props.textStyle - Inline style applied to the text elements
 * @param {string} props.className - Additional class for the container
 * @param {string} props.align - Text alignment ('left', 'center', etc.)
 * @param {number} props.iconSize - Size of the pencil/check icons
 * @param {boolean} props.showAddButton - Whether to show a dashed "Add name" button when empty
 * @param {number} props.maxLength - Maximum character count for the input
 */
export function InlineNameEditor({
  value,
  onSave,
  placeholder = 'Name...',
  emptyLabel = 'Add a name...',
  textStyle = {},
  className = '',
  align = 'left',
  iconSize = 14,
  showAddButton = true,
  maxLength = MAX_LENGTH
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);
  const isSavingRef = useRef(false);

  useBackHandler(() => {
    if (editing) {
      setLocalValue(value || '');
      setEditing(false);
      return true;
    }
    return false;
  }, editing);

  // Focus the input after mount in editing mode
  useEffect(() => {
    if (editing && inputRef.current) {
      // requestAnimationFrame ensures the input is rendered & animated before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        // Place cursor at end
        const len = inputRef.current?.value?.length ?? 0;
        inputRef.current?.setSelectionRange(len, len);
      });
    }
  }, [editing]);

  const hasValue = value && value.trim().length > 0;

  const handleSave = useCallback(async (e) => {
    e?.stopPropagation?.();
    // Guard against double-fire from blur + click race
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    setEditing(false);
    const newName = localValue.trim();
    if (newName !== (value || '')) {
      await onSave(newName);
    }

    // Reset guard after a tick
    requestAnimationFrame(() => {
      isSavingRef.current = false;
    });
  }, [localValue, value, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSave(e);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setLocalValue(value || '');
      setEditing(false);
    }
  }, [handleSave, value]);

  const handleStartEdit = useCallback((e) => {
    e.stopPropagation();
    setLocalValue(value || '');
    setEditing(true);
  }, [value]);

  const handleChange = useCallback((e) => {
    const next = e.target.value;
    if (next.length <= maxLength) {
      setLocalValue(next);
    }
  }, [maxLength]);

  const charCount = localValue.length;
  const nearLimit = charCount >= WARN_THRESHOLD;
  const atLimit = charCount >= maxLength;

  if (editing) {
    return (
      <div
        className={`${styles.container} ${className}`}
        style={{ textAlign: align }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.inputRow}>
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              style={{
                ...textStyle,
                textAlign: align,
                ...(charCount > 0 ? { paddingRight: '48px' } : {})
              }}
              value={localValue}
              onChange={handleChange}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              aria-label="Session name"
            />
            {charCount > 0 && (
              <span
                className={styles.charCount}
                data-near-limit={nearLimit ? 'true' : undefined}
                data-at-limit={atLimit ? 'true' : undefined}
                aria-live="polite"
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
          <button
            className={styles.saveBtn}
            onMouseDown={(e) => {
              // Prevent blur from firing before click
              e.preventDefault();
              handleSave(e);
            }}
            aria-label="Save"
          >
            <Check size={iconSize + 2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} style={{ textAlign: align }}>
      {hasValue || !showAddButton ? (
        <button
          className={styles.displayBtn}
          onClick={handleStartEdit}
          aria-label="Edit name"
        >
          <span className={styles.displayText} style={textStyle}>
            {value || emptyLabel}
          </span>
          <Pencil size={iconSize} className={styles.pencil} />
        </button>
      ) : (
        <button
          className={styles.addBtn}
          onClick={handleStartEdit}
          style={{ justifyContent: align === 'center' ? 'center' : 'flex-start' }}
          aria-label="Add name"
        >
          <span className={styles.addBtnIcon}>
            <Pencil size={iconSize} />
          </span>
          <span style={textStyle}>{emptyLabel}</span>
        </button>
      )}
    </div>
  );
}
