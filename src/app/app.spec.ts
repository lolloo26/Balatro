import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('shows the flower theme and previews a keyboard-ready hand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Ogni mano mette radici');
    expect(page.querySelectorAll('.home-boss-card')).toHaveLength(8);
    expect(page.querySelector('.home-boss-list')?.textContent).toContain('Michael Jackson');
    expect(page.querySelector('.home-boss-list')?.textContent).toContain('Hamburgerona');

    const startButton = [...page.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Inizia una nuova partita'),
    );
    expect(startButton).toBeDefined();
    startButton?.click();
    fixture.detectChanges();

    expect(page.querySelector('h1')?.textContent).toContain('I bui di questa ante');
    expect(page.querySelectorAll('.blind-card')).toHaveLength(3);
    expect(page.querySelectorAll('.blind-play-button')).toHaveLength(1);
    expect(page.querySelector('.blind-list')?.textContent).toContain('300');
    expect(page.querySelector('.blind-list')?.textContent).toContain('450');
    expect(page.querySelector('.blind-list')?.textContent).toContain('600');
    page.querySelector<HTMLButtonElement>('.blind-play-button')?.click();
    fixture.detectChanges();

    expect(page.querySelector('h1')?.textContent).toContain('Anta 1');
    expect(page.querySelector('h1')?.textContent).toContain('Piccolo buio');
    expect(page.querySelectorAll('[role="option"]')).toHaveLength(8);
    expect(page.querySelector('.selection-empty')?.textContent).toContain(
      'La carta più alta è a sinistra, la più bassa a destra',
    );
    const ranks = [...page.querySelectorAll<HTMLElement>('[data-rank]')].map((card) =>
      Number(card.dataset['rank']),
    );
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
    expect(page.querySelector('.action-button')?.textContent).toContain('4');
    expect(page.querySelector('[aria-keyshortcuts="D"]')).not.toBeNull();

    page.querySelector<HTMLElement>('[role="option"]')?.click();
    fixture.detectChanges();
    expect(page.querySelector('.selection-preview')?.textContent).toContain('Carta alta');
    expect(page.querySelector('.selection-preview')?.getAttribute('aria-label')).toContain(
      'Carta alta',
    );
  });

  it('returns to the main menu and lets the player resume without changing the saved run', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('.welcome-panel button')?.click();
    fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.blind-play-button')?.click();
    fixture.detectChanges();

    const savedState = JSON.parse(localStorage.getItem('seme-e-stelle-save-v1')!).state;
    page.querySelector<HTMLButtonElement>('.button-new-game')?.click();
    fixture.detectChanges();
    expect(page.querySelector('.home-game-actions')?.textContent).toContain('Continua la partita');
    expect(page.querySelector('.home-game-actions')?.textContent).toContain('Nuova partita');
    expect(JSON.parse(localStorage.getItem('seme-e-stelle-save-v1')!).state).toEqual(savedState);

    page.querySelector<HTMLButtonElement>('.home-game-actions .button-primary')?.click();
    fixture.detectChanges();
    expect(page.querySelector('h1')?.textContent).toContain('Anta 1');
    expect(page.querySelectorAll('[role="option"]')).toHaveLength(8);
  });
});
