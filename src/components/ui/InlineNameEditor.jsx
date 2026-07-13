import React, { useState } from 'react';
import { Pencil, Check } from '@utils/icons';
import { useBackHandler } from '@hooks/useBackHandler';
import styles from './InlineNameEditor.module.css';

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
  showAddButton = true
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  useBackHandler(() => {
    if (editing) {
      setLocalValue(value || '');
      setEditing(false);
      return true;
    }
    return false;
  }, editing);

  const hasValue = value && value.trim().length > 0;

  const handleSave = async (e) => {
    e.stopPropagation();
    setEditing(false);
    const newName = localValue.trim();
    if (newName !== (value || '')) {
      await onSave(newName);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(e);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setLocalValue(value || '');
      setEditing(false);
    }
  };

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setLocalValue(value || '');
    setEditing(true);
  };

  if (editing) {
    return (
      <div className={`${styles.container} ${className}`} style={{ textAlign: align }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputRow}>
          <input
            type="text"
            className={styles.input}
            style={{ ...textStyle, textAlign: align }}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
          />
          <button className={styles.saveBtn} onClick={handleSave} aria-label="Save">
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
          <Pencil size={iconSize} />
          <span style={textStyle}>{emptyLabel}</span>
        </button>
      )}
    </div>
  );
}
