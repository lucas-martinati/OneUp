import { useTweenedNumber } from '@hooks/useTweenedNumber';

/** Smooth count-up feedback, isolated from the rest of the exercise panel. */
export function CountingNumber({ value }) {
    const display = useTweenedNumber(value);
    return <span aria-label={String(value)}>{Math.round(display)}</span>;
}
