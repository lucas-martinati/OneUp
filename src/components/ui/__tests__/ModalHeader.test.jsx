import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

import { ModalHeader } from '../ModalHeader';
import { Shield } from '@utils/icons';

afterEach(cleanup);

describe('ModalHeader', () => {
  it('renders title and close button by default', () => {
    const onClose = vi.fn();
    render(<ModalHeader title="Panel d'Administration" onClose={onClose} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe("Panel d'Administration");
    expect(heading.getAttribute('title')).toBe("Panel d'Administration");
    expect(heading.className).toContain('modal-header-title');

    const closeBtn = screen.getByLabelText('common.close');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders subtitle when provided', () => {
    render(<ModalHeader title="Statistiques" subtitle="Vue détaillée" onClose={() => {}} />);

    expect(screen.getByText('Vue détaillée')).toBeTruthy();
    const subtitleEl = screen.getByText('Vue détaillée');
    expect(subtitleEl.className).toContain('modal-header-subtitle');
    expect(subtitleEl.getAttribute('title')).toBe('Vue détaillée');
  });

  it('renders icon with proper aria-hidden container', () => {
    const { container } = render(
      <ModalHeader title="Sécurité" icon={Shield} onClose={() => {}} />
    );

    const iconWrap = container.querySelector('.modal-header-icon');
    expect(iconWrap).toBeTruthy();
    expect(iconWrap.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders back button and triggers onBack when showBack is true', () => {
    const onBack = vi.fn();
    render(<ModalHeader title="Édition" showBack onBack={onBack} onClose={() => {}} />);

    const backBtn = screen.getByLabelText('onboarding.back');
    expect(backBtn).toBeTruthy();
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders custom actions inside modal-header-actions', () => {
    const onRefresh = vi.fn();
    render(
      <ModalHeader
        title="Admin"
        onClose={() => {}}
        actions={<button onClick={onRefresh}>Actualiser</button>}
      />
    );

    const refreshBtn = screen.getByText('Actualiser');
    expect(refreshBtn).toBeTruthy();
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    const actionsContainer = screen.getByText('Actualiser').closest('.modal-header-actions');
    expect(actionsContainer).toBeTruthy();
  });

  it('hides close button when showClose is false', () => {
    render(<ModalHeader title="Sans fermeture" showClose={false} onClose={() => {}} />);
    expect(screen.queryByLabelText('common.close')).toBe(null);
  });

  it('supports multiline class when multiline prop is true', () => {
    render(<ModalHeader title="Titre très long nécessitant plusieurs lignes" multiline onClose={() => {}} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.className).toContain('modal-header-title--multiline');
  });

  it('wraps title and subtitle in modal-header-text container', () => {
    const { container } = render(
      <ModalHeader title="Panel" subtitle="Sous-titre" onClose={() => {}} />
    );
    const textGroup = container.querySelector('.modal-header-text');
    expect(textGroup).toBeTruthy();
    expect(textGroup.querySelector('.modal-header-title')).toBeTruthy();
    expect(textGroup.querySelector('.modal-header-subtitle')).toBeTruthy();
  });
});
