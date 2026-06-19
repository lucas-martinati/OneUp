import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react';
import { Calendar } from '../Calendar';

// Mock react-i18next with both useTranslation and the initReactI18next plugin object
const mockLanguage = { language: 'es' };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'calendar.months') {
        return [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
      }
      if (key === 'calendar.weekdays') {
        return ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
      }
      if (key === 'calendar.day') {
        return `Día ${options?.num}`;
      }
      return key;
    },
    i18n: mockLanguage,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }
}));

const mockGetConfig = vi.fn().mockReturnValue({ difficulty: 1.0 });
const mockGetDayNumber = vi.fn().mockReturnValue(19);
const mockOnClose = vi.fn();

const defaultProps = {
  startDate: '2026-06-01',
  completions: {
    '2026-06-19': {
      pushups: { isCompleted: true }
    }
  },
  exercises: [
    { id: 'pushups', name: 'Lagartijas', color: '#ff0000', icon: 'pushups' }
  ],
  isCustom: false,
  getDayNumber: mockGetDayNumber,
  onClose: mockOnClose,
  getConfig: mockGetConfig
};

beforeEach(() => {
  cleanup();
  mockGetConfig.mockClear();
  mockGetDayNumber.mockClear();
  mockOnClose.mockClear();
  mockLanguage.language = 'es';
});

describe('Calendar and DayDetail date translation', () => {
  it('should display the day detail with translated date according to i18n language', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20'));

    render(<Calendar {...defaultProps} />);

    // Find the button for June 19th
    // In Spanish, monthNames[5] is "Junio"
    const dayButton = screen.getByRole('button', { name: '19 Junio' });
    expect(dayButton).toBeTruthy();

    // Click to open DayDetail
    fireEvent.click(dayButton);

    // Verify DayDetail is rendered with Spanish date format
    const expectedEsDate = new Date('2026-06-19T00:00:00').toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    expect(screen.getByText(expectedEsDate)).toBeTruthy();

    vi.useRealTimers();
  });
});

describe('Calendar swipe and touch events', () => {
  it('handles horizontal swipe to change month in Calendar', () => {
    render(<Calendar {...defaultProps} />);
    const overlay = document.querySelector('.modal-overlay');
    
    // Simulate swipe left (next month)
    fireEvent.touchStart(overlay, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchMove(overlay, { touches: [{ clientX: 100, clientY: 200 }] }); // Move left
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientX: 50, clientY: 200 }] }); // End far left
    
    // Simulate swipe right (prev month)
    fireEvent.touchStart(overlay, { touches: [{ clientX: 50, clientY: 200 }] });
    fireEvent.touchMove(overlay, { touches: [{ clientX: 150, clientY: 200 }] }); // Move right
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientX: 200, clientY: 200 }] }); // End far right
    
    // Short swipe (snap back)
    fireEvent.touchStart(overlay, { touches: [{ clientX: 100, clientY: 200 }] });
    fireEvent.touchMove(overlay, { touches: [{ clientX: 90, clientY: 200 }] }); 
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientX: 90, clientY: 200 }] }); 

    // Vertical move (aborts swipe)
    fireEvent.touchStart(overlay, { touches: [{ clientX: 100, clientY: 200 }] });
    fireEvent.touchMove(overlay, { touches: [{ clientX: 100, clientY: 300 }] }); 
  });

  it('handles vertical swipe to close DayDetail', async () => {
    render(<Calendar {...defaultProps} />);
    // Click on a day to open DayDetail
    fireEvent.click(screen.getByRole('button', { name: '19 Junio' }));

    // Wait for requestAnimationFrame to set isVisible to true
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // DayDetail
    const sheets = document.querySelectorAll('.modal-overlay');
    const sheet = sheets[1].children[0];
    
    // Simulate swipe down (close)
    fireEvent.touchStart(sheet, { touches: [{ clientY: 200 }] });
    fireEvent.touchMove(sheet, { touches: [{ clientY: 300 }] });
    fireEvent.touchEnd(sheet);
    
    // Simulate mouse drag
    fireEvent.mouseDown(sheet, { clientY: 200 });
    fireEvent.mouseMove(sheet, { clientY: 250 });
    fireEvent.mouseUp(sheet);

    // Simulate drag < 80px to trigger snap back
    vi.useFakeTimers();
    fireEvent.mouseDown(sheet, { clientY: 200 });
    fireEvent.mouseMove(sheet, { clientY: 240 }); // dragPx = 40
    fireEvent.mouseUp(sheet);
    
    // Advance timer to trigger the setTimeout for snap back
    act(() => {
        vi.advanceTimersByTime(450);
    });
    vi.useRealTimers();

    // Simulate drag > 80px to trigger close
    fireEvent.mouseDown(sheet, { clientY: 200 });
    fireEvent.mouseMove(sheet, { clientY: 400 }); // diff = 200, px = 100 > 80
    fireEvent.mouseLeave(sheet);
    
    // Simulate transition end
    fireEvent.transitionEnd(sheet, { propertyName: 'transform' });

    // Simulate click propagation stop
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    vi.spyOn(clickEvent, 'stopPropagation');
    fireEvent(sheet, clickEvent);
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
  });
});
