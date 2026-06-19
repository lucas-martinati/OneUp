import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
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
