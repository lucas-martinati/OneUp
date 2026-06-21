import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, cleanup } from '@testing-library/react';

const authValue = { isSignedIn: true, user: { uid: 'u1' }, loading: false, signIn: vi.fn() };
vi.mock('@hooks/useGoogleAuth', () => ({ useGoogleAuth: () => authValue }));

import { AuthProvider, useAuth } from '../AuthContext';

beforeEach(() => cleanup());

describe('AuthContext', () => {
  it('provides the auth value from useGoogleAuth to consumers', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBe(authValue);
    expect(result.current.isSignedIn).toBe(true);
  });

  it('throws when used outside of the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/within <AuthProvider>/);
    console.error.mockRestore();
  });

  it('renders its children', () => {
    const { getByText } = render(<AuthProvider><span>child</span></AuthProvider>);
    expect(getByText('child')).toBeTruthy();
  });
});
