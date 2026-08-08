import React from 'react';
import { GripVertical, ChevronUp, ChevronDown, Edit2, Trash2 } from '@utils/icons';
import { ListActionButton } from './ListActionButton';
import { useTranslation } from 'react-i18next';

/**
 * A standardized row component for lists that supports reordering (drag & drop handle + arrows) 
 * and actions (edit, delete).
 */
export function ListActionRow({
    children,
    className,
    style,
    
    // Drag & Drop
    isDraggable = false,
    dragProps = {}, // Props spread on the container (e.g., onDragStart, onDragOver)
    dragHandleProps = {}, // Props spread on the drag handle (e.g., onTouchStart)
    
    // Ordering
    showOrderControls = false,
    isFirst = false,
    isLast = false,
    onMoveUp,
    onMoveDown,
    
    // Actions
    onEdit,
    onDelete,
    deleteIcon = Trash2, // default delete icon
    
    // Custom Actions
    renderActions,
}) {
    const { t } = useTranslation();
    
    return (
        <div
            className={className}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                ...style,
            }}
            draggable={isDraggable}
            {...(isDraggable ? dragProps : {})}
        >
            {/* Left side: Grip + Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, overflow: 'hidden' }}>
                {isDraggable && (
                    <div
                        {...dragHandleProps}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255, 255, 255, 0.35)',
                            cursor: 'grab', touchAction: 'none', 
                            flexShrink: 0,
                            ...(dragHandleProps.style || {})
                        }}
                    >
                        <GripVertical size={16} />
                    </div>
                )}
                
                {/* Main Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {children}
                </div>
            </div>

            {/* Right side: Actions */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                {showOrderControls && (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1px', 
                        flexShrink: 0, 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '2px', 
                        marginRight: '4px' 
                    }}>
                        <ListActionButton
                            shape="up"
                            onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
                            disabled={isFirst}
                            aria-label="Move up"
                            icon={ChevronUp}
                        />
                        <ListActionButton
                            shape="down"
                            onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
                            disabled={isLast}
                            aria-label="Move down"
                            icon={ChevronDown}
                        />
                    </div>
                )}

                {renderActions ? renderActions() : null}

                {onEdit && (
                    <ListActionButton
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        aria-label={t('common.edit')}
                        icon={Edit2}
                    />
                )}

                {onDelete && (
                    <ListActionButton
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        aria-label={t('common.delete')}
                        icon={deleteIcon}
                    />
                )}
            </div>
        </div>
    );
}
