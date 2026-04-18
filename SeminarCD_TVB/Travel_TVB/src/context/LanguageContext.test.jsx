import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from './LanguageContext';

// Helper component to read language context values
function LanguageConsumer() {
  const { currentLanguage, languages, handleLanguageSelect } = useLanguage();
  return (
    <div>
      <span data-testid="currentCode">{currentLanguage.code}</span>
      <span data-testid="currentName">{currentLanguage.name}</span>
      <span data-testid="languageCount">{languages.length}</span>
      {languages.map(lang => (
        <button key={lang.code} onClick={() => handleLanguageSelect(lang)} data-testid={`select-${lang.code}`}>
          {lang.name}
        </button>
      ))}
    </div>
  );
}

function renderLanguageProvider() {
  return render(
    <LanguageProvider>
      <LanguageConsumer />
    </LanguageProvider>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.classList.remove('locale-zh');
  });

  // --- Initial language ---

  describe('getInitialLanguage', () => {
    it('should default to English when no sessionStorage value', () => {
      renderLanguageProvider();
      expect(screen.getByTestId('currentCode')).toHaveTextContent('en');
      expect(screen.getByTestId('currentName')).toHaveTextContent('English');
    });

    it('should read language from sessionStorage.preferredLanguage', () => {
      sessionStorage.setItem('preferredLanguage', 'vi');
      renderLanguageProvider();
      expect(screen.getByTestId('currentCode')).toHaveTextContent('vi');
    });

    it('should fall back to English for invalid sessionStorage code', () => {
      sessionStorage.setItem('preferredLanguage', 'xx');
      renderLanguageProvider();
      expect(screen.getByTestId('currentCode')).toHaveTextContent('en');
    });
  });

  // --- handleLanguageSelect ---

  describe('handleLanguageSelect', () => {
    it('should update currentLanguage state', async () => {
      const user = userEvent.setup();
      renderLanguageProvider();

      await user.click(screen.getByTestId('select-vi'));
      expect(screen.getByTestId('currentCode')).toHaveTextContent('vi');
    });

    it('should save to sessionStorage.preferredLanguage', async () => {
      const user = userEvent.setup();
      renderLanguageProvider();

      await user.click(screen.getByTestId('select-vi'));
      expect(sessionStorage.getItem('preferredLanguage')).toBe('vi');
    });
  });

  // --- Chinese font class effect ---

  describe('Chinese font class effect', () => {
    it('should add "locale-zh" class to body when language is zh', async () => {
      const user = userEvent.setup();
      renderLanguageProvider();

      await user.click(screen.getByTestId('select-zh'));
      expect(document.body.classList.contains('locale-zh')).toBe(true);
    });

    it('should remove "locale-zh" class when switching away from zh', async () => {
      const user = userEvent.setup();
      renderLanguageProvider();

      // Switch to Chinese
      await user.click(screen.getByTestId('select-zh'));
      expect(document.body.classList.contains('locale-zh')).toBe(true);

      // Switch to English
      await user.click(screen.getByTestId('select-en'));
      expect(document.body.classList.contains('locale-zh')).toBe(false);
    });

    it('should NOT have "locale-zh" class for non-Chinese languages', () => {
      renderLanguageProvider();
      expect(document.body.classList.contains('locale-zh')).toBe(false);
    });
  });

  // --- Context value ---

  describe('context value', () => {
    it('should provide languages array with 3 entries', () => {
      renderLanguageProvider();
      expect(screen.getByTestId('languageCount')).toHaveTextContent('3');
    });

    it('should provide vi, en, zh languages', () => {
      renderLanguageProvider();
      expect(screen.getByTestId('select-vi')).toBeInTheDocument();
      expect(screen.getByTestId('select-en')).toBeInTheDocument();
      expect(screen.getByTestId('select-zh')).toBeInTheDocument();
    });
  });
});
