import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { InlineNameEditor } from '../InlineNameEditor';

vi.mock('@utils/icons', () => ({
    Pencil: () => <span>Pencil</span>,
    Check: () => <span>Check</span>,
}));

vi.mock('@hooks/useBackHandler', () => ({
    useBackHandler: vi.fn(() => {
        // We can expose the callback to trigger it manually if needed
        return null;
    }),
}));

describe('InlineNameEditor', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders empty add button when no value and showAddButton is true', () => {
        const { getByRole, getByText } = render(
            <InlineNameEditor value="" onSave={vi.fn()} emptyLabel="Add name" />
        );
        expect(getByRole('button', { name: 'Add name' })).toBeTruthy();
        expect(getByText('Add name')).toBeTruthy();
    });

    it('renders display button when value exists', () => {
        const { getByRole, getByText } = render(
            <InlineNameEditor value="My Session" onSave={vi.fn()} />
        );
        expect(getByRole('button', { name: 'Edit name' })).toBeTruthy();
        expect(getByText('My Session')).toBeTruthy();
    });

    it('enters edit mode when clicked', () => {
        const { getByRole, queryByRole } = render(
            <InlineNameEditor value="My Session" onSave={vi.fn()} />
        );
        fireEvent.click(getByRole('button', { name: 'Edit name' }));
        
        expect(getByRole('textbox', { name: 'Session name' })).toBeTruthy();
        expect(queryByRole('button', { name: 'Edit name' })).toBeNull();
    });

    it('updates local value on change and respects max length', () => {
        const { getByRole } = render(
            <InlineNameEditor value="" onSave={vi.fn()} maxLength={10} />
        );
        fireEvent.click(getByRole('button', { name: 'Add name' }));
        
        const input = getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Hello World' } });
        // Since input maxLength logic is also native, we test our handleChange guard
        // Our onChange guards if length <= maxLength. 'Hello World' is 11, so it shouldn't update if our handler prevents it
        // Wait, the handler says: if (next.length <= maxLength) setLocalValue(next)
        expect(input.value).toBe(''); // State didn't update because length > 10

        fireEvent.change(input, { target: { value: 'Valid' } });
        expect(input.value).toBe('Valid');
    });

    it('saves on blur', async () => {
        const onSave = vi.fn();
        const { getByRole } = render(
            <InlineNameEditor value="Old" onSave={onSave} />
        );
        fireEvent.click(getByRole('button', { name: 'Edit name' }));
        
        const input = getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New' } });
        fireEvent.blur(input);

        expect(onSave).toHaveBeenCalledWith('New');
    });

    it('saves on Enter key', async () => {
        const onSave = vi.fn();
        const { getByRole } = render(
            <InlineNameEditor value="Old" onSave={onSave} />
        );
        fireEvent.click(getByRole('button', { name: 'Edit name' }));
        
        const input = getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onSave).toHaveBeenCalledWith('New');
    });

    it('cancels on Escape key', () => {
        const onSave = vi.fn();
        const { getByRole, queryByRole, getByText } = render(
            <InlineNameEditor value="Old" onSave={onSave} />
        );
        fireEvent.click(getByRole('button', { name: 'Edit name' }));
        
        const input = getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New' } });
        fireEvent.keyDown(input, { key: 'Escape' });

        expect(onSave).not.toHaveBeenCalled();
        expect(queryByRole('textbox')).toBeNull();
        expect(getByText('Old')).toBeTruthy();
    });

    it('saves on save button click', () => {
        const onSave = vi.fn();
        const { getByRole } = render(
            <InlineNameEditor value="Old" onSave={onSave} />
        );
        fireEvent.click(getByRole('button', { name: 'Edit name' }));
        
        const input = getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New' } });
        
        const saveBtn = getByRole('button', { name: 'Save' });
        // It uses onMouseDown to prevent blur
        fireEvent.mouseDown(saveBtn);

        expect(onSave).toHaveBeenCalledWith('New');
    });

    it('does not save if value did not change', () => {
        const onSave = vi.fn();
        const { getByRole } = render(
            <InlineNameEditor value="Same" onSave={onSave} />
        );
        fireEvent.click(getByRole('button', { name: 'Edit name' }));
        
        const saveBtn = getByRole('button', { name: 'Save' });
        fireEvent.mouseDown(saveBtn);

        expect(onSave).not.toHaveBeenCalled();
    });

    it('shows character count when typing', () => {
        const { getByRole, getByText } = render(
            <InlineNameEditor value="" onSave={vi.fn()} maxLength={60} />
        );
        fireEvent.click(getByRole('button', { name: 'Add name' }));
        
        const input = getByRole('textbox');
        fireEvent.change(input, { target: { value: 'A' } });
        
        expect(getByText('1/60')).toBeTruthy();
    });
});
