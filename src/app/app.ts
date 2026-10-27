import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  BLIND_NAMES,
  BLIND_TARGETS,
  BOSS_DEFINITIONS,
  GameStateService,
} from './game-state.service';
import {
  Card,
  evaluateHand,
  HandScore,
  JOKERS,
  JokerId,
  RANK_NAMES,
  SUIT_NAMES,
  SUIT_SYMBOLS,
} from './game';

@Component({
  selector: 'mano-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly game = inject(GameStateService);
  protected readonly state = this.game.state;
  protected readonly showMainMenu = signal(true);
  protected readonly selectedHand = computed(() => {
    const currentState = this.state();
    const selectedCards = currentState.hand
      .filter((card) => currentState.selectedIds.includes(card.id))
      .map((card) => this.game.effectiveCard(card, currentState.distortedCards));
    if (selectedCards.length === 0) return null;

    const boss =
      currentState.phase === 'playing' && currentState.blind === 2
        ? BOSS_DEFINITIONS[currentState.round]
        : undefined;
    const hand = evaluateHand(selectedCards);
    const disabledJokerIds: JokerId[] = [];
    if (boss?.id === 'big-bro' && currentState.jokerIds[0]) {
      disabledJokerIds.push(currentState.jokerIds[0]);
    }
    if (boss?.id === 'sigma-boy' && currentState.jokerIds.includes('royal-spark')) {
      disabledJokerIds.push('royal-spark');
    }
    return evaluateHand(selectedCards, currentState.jokerIds, {
      disabledJokerIds,
      scoreMultiplier:
        boss?.id === 'lion' && ['pair', 'two-pair', 'three-kind'].includes(hand.kind) ? 0.5 : 1,
    });
  });
  protected readonly storageNotice = this.game.storageNotice;
  protected readonly jokers = JOKERS;
  protected readonly suitNames = SUIT_NAMES;
  protected readonly suitSymbols = SUIT_SYMBOLS;
  protected readonly rankNames = RANK_NAMES;
  protected readonly blindNames = BLIND_NAMES;
  protected readonly blindTargets = BLIND_TARGETS;
  protected readonly bosses = BOSS_DEFINITIONS;
  protected readonly bossOverview = Object.entries(BOSS_DEFINITIONS).map(([ante, boss]) => ({
    ante: Number(ante),
    ...boss,
  }));
  protected activeCardIndex = 0;

  @ViewChildren('handCard') private handCardButtons!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('phaseHeading') private phaseHeading?: ElementRef<HTMLElement>;
  @ViewChild('helpDialog') private helpDialog?: ElementRef<HTMLDialogElement>;

  private helpOpener?: HTMLElement;

  protected isSelected(card: Card): boolean {
    return this.state().selectedIds.includes(card.id);
  }

  protected jokerFor(id: JokerId) {
    return this.jokers.find((joker) => joker.id === id);
  }

  protected cardLabel(card: Card): string {
    const selected = this.isSelected(card) ? ', selezionata' : '';
    const face = this.faceOf(card);
    return `${this.rankNames[face.rank]} di ${this.suitNames[face.suit]}${selected}`;
  }

  protected faceOf(card: Card): Card {
    return this.game.effectiveCard(card, this.state().distortedCards);
  }

  protected blindLabel(index: number): string {
    return index === 2 ? BOSS_DEFINITIONS[this.state().round].name : BLIND_NAMES[index];
  }

  protected activeBoss() {
    const state = this.state();
    return state.phase === 'playing' && state.blind === 2
      ? BOSS_DEFINITIONS[state.round]
      : undefined;
  }

  protected isJokerDisabled(id: JokerId, index: number): boolean {
    const boss = this.activeBoss();
    return (
      (boss?.id === 'big-bro' && index === 0) || (boss?.id === 'sigma-boy' && id === 'royal-spark')
    );
  }

  protected disabledJokerReason(id: JokerId, index: number): string {
    const boss = this.activeBoss();
    if (boss?.id === 'big-bro' && index === 0) return 'Disattivato da Big bro';
    if (boss?.id === 'sigma-boy' && id === 'royal-spark') {
      return 'Bonus al moltiplicatore disattivato';
    }
    return '';
  }

  protected toggleCard(card: Card, index: number): void {
    this.activeCardIndex = index;
    this.game.toggleCard(card.id);
  }

  protected onCardKeydown(event: KeyboardEvent, index: number): void {
    const columnCount = window.innerWidth <= 900 ? 4 : 8;
    const movement: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columnCount,
      ArrowDown: columnCount,
    };
    let nextIndex = index;

    if (event.key in movement) {
      nextIndex = Math.max(0, Math.min(this.state().hand.length - 1, index + movement[event.key]));
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = this.state().hand.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    this.focusHandCard(nextIndex);
  }

  protected playSelectedCards(): void {
    const previousPhase = this.state().phase;
    const hadSelection = this.state().selectedIds.length > 0;
    this.game.playSelectedCards();
    if (!hadSelection) return;
    this.focusAfterHandAction(previousPhase);
  }

  protected discardSelectedCards(): void {
    const previousPhase = this.state().phase;
    const hadSelection = this.state().selectedIds.length > 0;
    const previousDiscards = this.state().discardsLeft;
    this.game.discardSelectedCards();
    if (hadSelection && this.state().discardsLeft === previousDiscards - 1) {
      this.focusAfterHandAction(previousPhase);
    }
  }

  protected handPreviewDescription(hand: HandScore): string {
    return `${hand.name}, ${hand.chips} fiches per ${hand.multiplier}, ${hand.score} punti`;
  }

  protected sortHand(): void {
    this.game.sortHand();
    this.focusHandCard(0);
  }

  protected startNewGame(): void {
    this.activeCardIndex = 0;
    this.showMainMenu.set(false);
    this.game.startNewGame();
    this.focusPhaseHeading();
  }

  protected returnToMainMenu(): void {
    this.showMainMenu.set(true);
  }

  protected continueGame(): void {
    this.showMainMenu.set(false);
    this.focusPhaseHeading();
  }

  protected startBlind(): void {
    this.activeCardIndex = 0;
    this.game.startBlind();
    this.focusHandCard(0);
  }

  protected buyJoker(id: JokerId): void {
    const previousCount = this.state().jokerIds.length;
    this.game.buyJoker(id);
    if (this.state().jokerIds.length > previousCount) this.focusPhaseHeading();
  }

  protected continueToNextRound(): void {
    this.activeCardIndex = 0;
    this.game.continueToNextRound();
    this.focusPhaseHeading();
  }

  protected openHelp(): void {
    const dialog = this.helpDialog?.nativeElement;
    if (!dialog || dialog.open) return;
    this.helpOpener =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    dialog.showModal();
  }

  protected closeHelp(): void {
    if (this.helpDialog?.nativeElement.open) this.helpDialog.nativeElement.close();
  }

  protected onHelpClosed(): void {
    const opener = this.helpOpener;
    this.helpOpener = undefined;
    window.setTimeout(() => opener?.focus());
  }

  @HostListener('window:keydown', ['$event'])
  protected onGlobalKeydown(event: KeyboardEvent): void {
    if (this.helpDialog?.nativeElement.open) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeHelp();
      }
      return;
    }
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select'))
      return;

    if (event.key === '?') {
      event.preventDefault();
      this.openHelp();
      return;
    }
    if (this.state().phase !== 'playing') return;

    switch (event.key.toLowerCase()) {
      case 'd':
        event.preventDefault();
        this.playSelectedCards();
        break;
      case 'x':
        event.preventDefault();
        this.discardSelectedCards();
        break;
      case 'o':
        event.preventDefault();
        this.sortHand();
        break;
    }
  }

  private focusAfterHandAction(previousPhase: string): void {
    if (this.state().phase !== previousPhase) {
      this.focusPhaseHeading();
    } else {
      this.focusHandCard(this.activeCardIndex);
    }
  }

  private focusHandCard(index: number): void {
    const safeIndex = Math.max(0, Math.min(index, this.state().hand.length - 1));
    this.activeCardIndex = safeIndex;
    window.setTimeout(() => this.handCardButtons.get(safeIndex)?.nativeElement.focus());
  }

  private focusPhaseHeading(): void {
    window.setTimeout(() => this.phaseHeading?.nativeElement.focus());
  }
}
