import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { GuestCloudBackupBanner } from '../GuestCloudBackupBanner';

const mockAuth = { isSignedIn: false, signIn: vi.fn() };
vi.mock('@contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

vi.mock('@utils/icons', () => ({
  Cloud: () => <span>CloudIcon</span>,
  X: () => <span>CloseIcon</span>,
}));

vi.mock('@components/ui/GoogleIcon', () => ({
  GoogleIcon: ({ size }) => <svg data-testid="google-icon" width={size} height={size} />,
}));

describe('GuestCloudBackupBanner', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    mockAuth.isSignedIn = false;
  });

  it('renders nothing when user is already signed in', () => {
    mockAuth.isSignedIn = true;
    const { container } = render(<GuestCloudBackupBanner displayStreak={5} totalReps={100} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when guest has zero streak and zero reps', () => {
    const { container } = render(<GuestCloudBackupBanner displayStreak={0} totalReps={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the backup banner when guest has active streak or reps', () => {
    const { getByText } = render(<GuestCloudBackupBanner displayStreak={3} totalReps={50} />);
    expect(getByText('Sauvegardez vos progrès')).toBeTruthy();
    expect(getByText('CloudIcon')).toBeTruthy();
    expect(getByText('Sauvegarder')).toBeTruthy();
  });

  it('calls auth.signIn when action button is clicked', () => {
    const { getByText } = render(<GuestCloudBackupBanner displayStreak={3} totalReps={50} />);
    const button = getByText('Sauvegarder').closest('button');
    fireEvent.click(button);
    expect(mockAuth.signIn).toHaveBeenCalledTimes(1);
  });

  it('dismisses the banner when close button is clicked', () => {
    const { getByText, queryByText } = render(<GuestCloudBackupBanner displayStreak={3} totalReps={50} />);
    expect(getByText('Sauvegardez vos progrès')).toBeTruthy();

    const closeBtn = getByText('CloseIcon').closest('button');
    fireEvent.click(closeBtn);

    expect(queryByText('Sauvegardez vos progrès')).toBeNull();
    expect(sessionStorage.getItem('oneup_guest_cloud_banner_dismissed')).toBe('1');
  });
});
