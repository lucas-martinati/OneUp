import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { DailySummaryHeader } from '../DailySummaryHeader';

describe('DailySummaryHeader', () => {
    it('renders day number correctly when not hidden and not future', () => {
        const { getByText } = render(
            <DailySummaryHeader
                dayNumber={42}
                prevDayNumber={41}
                isCounterTransitioning={false}
                isDayPerfect={false}
                isFuture={false}
                effectiveStart="2026-01-01"
                hidden={false}
            />
        );
        expect(getByText('42')).toBeTruthy();
    });

    it('returns null when hidden is true', () => {
        const { container } = render(
            <DailySummaryHeader
                dayNumber={42}
                prevDayNumber={41}
                isCounterTransitioning={false}
                isDayPerfect={false}
                isFuture={false}
                effectiveStart="2026-01-01"
                hidden={true}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders starts text when isFuture is true', () => {
        const { getByText } = render(
            <DailySummaryHeader
                dayNumber={0}
                prevDayNumber={0}
                isCounterTransitioning={false}
                isDayPerfect={false}
                isFuture={true}
                effectiveStart="2026-08-01"
                hidden={false}
            />
        );
        expect(getByText('2026-08-01')).toBeTruthy();
    });
});
