import React, { useState, useEffect, useRef } from 'react';
import { Card as CardType } from '../types';
import Card from './Card';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { AudioEffects } from '../utils/audioEffects';

interface CardDeckProps {
  cards: CardType[];
  onComplete: () => void;
  onCardRevealed?: (card: CardType, index: number) => void;
}

const CardDeck: React.FC<CardDeckProps> = ({ cards, onComplete, onCardRevealed }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [revealedCards, setRevealedCards] = useState<CardType[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  const currentCard = cards[currentCardIndex];
  const isLastCard = currentCardIndex >= cards.length - 1;

  useEffect(() => {
    if (currentCardIndex === 0) {
      setRevealedCards([]);
    }
  }, [currentCardIndex]);

  // Initialize audio on first render
  useEffect(() => {
    AudioEffects.initializeAudio();
  }, []);

  const revealNextCard = () => {
    if (isAnimating || !currentCard) return;

    setIsAnimating(true);
    setSwipeDirection('left');

    // Effets sonores
    AudioEffects.playCardFlip();

    // Son spécial pour les cartes rares
    if (currentCard.rarity === 'super_rare' || currentCard.rarity === 'secret_rare') {
      setTimeout(() => {
        AudioEffects.playRareCardReveal(currentCard.rarity);
      }, 300);
    }

    // Ajouter la carte actuelle aux cartes révélées
    const newRevealedCards = [...revealedCards, currentCard];
    setRevealedCards(newRevealedCards);

    // Callback pour notifier la carte révélée
    onCardRevealed?.(currentCard, currentCardIndex);

    setTimeout(() => {
      if (isLastCard) {
        onComplete();
      } else {
        setCurrentCardIndex(prev => prev + 1);
      }
      setIsAnimating(false);
      setSwipeDirection(null);
    }, 600);
  };

  const resetDeck = () => {
    AudioEffects.playDeckShuffle();
    setCurrentCardIndex(0);
    setRevealedCards([]);
    setIsAnimating(false);
    setSwipeDirection(null);
  };

  // Gestion du swipe tactile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe) {
      revealNextCard();
    }
  };

  const getCardTransform = (index: number, isRevealed: boolean = false) => {
    const baseRotation = (index % 3 - 1) * 1; // Très légère rotation aléatoire
    const stackOffset = Math.min(index * 3, 9); // Petit offset pour l'effet de pile (empilage vertical)
    const scaleReduction = Math.max(0.98, 1 - index * 0.01); // Réduction minimale du scale

    if (isRevealed) {
      return `translateX(-120%) rotate(${baseRotation - 10}deg) scale(0.9)`;
    }

    if (index === 0 && !isAnimating) {
      // Carte du dessus - pas de décalage, taille normale
      return `translateX(0) translateY(0) rotate(${baseRotation}deg) scale(1)`;
    }

    if (index === 0 && swipeDirection === 'left') {
      return `translateX(-120%) rotate(-15deg) scale(0.9)`;
    }

    // Les cartes sont empilées les unes sur les autres avec un très léger décalage vertical
    return `translateX(0) translateY(${stackOffset}px) rotate(${baseRotation}deg) scale(${scaleReduction})`;
  };

  const getCardClassName = (index: number, isRevealed: boolean = false, card: CardType) => {
    let className = 'transition-all duration-600 ease-out';

    if (isRevealed) {
      className += ' card-slide-out';
    } else if (index === 0) {
      className += ' card-hover-glow';
      // Ajout des animations de surbrillance selon la rareté
      if (card.rarity === 'secret_rare') {
        className += ' secret-rare-effect secret-rare-shimmer';
      } else if (card.rarity === 'super_rare') {
        className += ' super-rare-shimmer';
      } else if (card.rarity === 'rare') {
        className += ' rare-shimmer';
      }
    } else if (index > 0 && index <= 2) {
      className += ' deck-shuffle';
      className += ` animation-delay-${index * 200}`;
    }

    return className;
  };

  const getCardZIndex = (index: number, isRevealed: boolean = false) => {
    if (isRevealed) return 1;
    return cards.length - index + 10;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Compteur de progression */}
      <div className="mb-6 text-center">
        <div className="text-white text-lg font-bold mb-2">
          {revealedCards.length > 0 ? `Carte ${revealedCards.length}/${cards.length}` : 'Prêt à révéler'}
        </div>
        <div className="w-64 bg-blue-800/40 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(revealedCards.length / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Deck de cartes */}
      <div
        ref={deckRef}
        className="relative w-80 h-[500px] cursor-pointer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={revealNextCard}
      >
        {/* Cartes révélées (à gauche) */}
        {revealedCards.map((card, index) => (
          <div
            key={`revealed-${card.id}-${index}`}
            className={`absolute ${getCardClassName(index, true, card)}`}
            style={{
              transform: getCardTransform(index, true),
              zIndex: getCardZIndex(index, true),
              opacity: 0.7,
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            <Card
              card={card}
              showStats={false}
              className="pointer-events-none select-none"
            />
            {/* Badge "Révélée" avec effet sparkle pour les cartes rares */}
            <div className={`absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold ${
              card.rarity === 'secret_rare' || card.rarity === 'super_rare' ? 'sparkle-effect' : ''
            }`}>
              {card.rarity === 'secret_rare' ? '🌟' : card.rarity === 'super_rare' ? '⭐' : '✓'}
            </div>
          </div>
        ))}

        {/* Cartes restantes dans la pile */}
        {cards.slice(currentCardIndex).map((card, index) => {
          const actualIndex = currentCardIndex + index;
          const isTopCard = index === 0;

          return (
            <div
              key={`deck-${card.id}-${actualIndex}`}
              className={`absolute ${getCardClassName(index, false, card)}`}
              style={{
                transform: getCardTransform(index),
                zIndex: getCardZIndex(index),
                opacity: index > 2 ? 0 : 1, // Ne montrer que les 3 premières cartes de la pile
                animationDelay: `${index * 100}ms`, // Décalage pour l'animation shuffle
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <Card
                card={card}
                showStats={false}
                className={`${isTopCard ? 'ring-2 ring-blue-400 ring-opacity-50' : ''} select-none`}
              />

              {/* Indicateur pour la carte du dessus avec effet spécial selon rareté */}
              {isTopCard && (
                <>
                  {/* Indicateur de rareté sur la carte du dessus */}
                  <div className="absolute bottom-2 left-2 text-xs font-bold px-2 py-1 rounded-full bg-black/50 text-white">
                    {card.rarity === 'secret_rare' ? '🌟 SECRET' :
                     card.rarity === 'super_rare' ? '⭐ SUPER' :
                     card.rarity === 'rare' ? '💎 RARE' : ''}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Indicateur de swipe */}
        {currentCard && !isAnimating && (
          <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-blue-400 animate-bounce">
            <div className="flex flex-col items-center space-y-2">
              <ChevronRight size={32} />
              <div className="text-xs text-center">
                Cliquez ou<br/>glissez
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="mt-6 flex space-x-4">
        {revealedCards.length > 0 && (
          <button
            onClick={resetDeck}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            <span>Recommencer</span>
          </button>
        )}

        <div className="text-blue-300 text-sm">
          {isLastCard && revealedCards.length === cards.length ? (
            <span className="text-green-400 font-bold">✨ Toutes les cartes révélées!</span>
          ) : (
            <span>
              {cards.length - currentCardIndex} carte(s) restante(s)
            </span>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-blue-300 text-sm max-w-md">
        {currentCardIndex === 0 && revealedCards.length === 0 ? (
          <p>Cliquez sur la pile ou glissez vers la gauche pour révéler la première carte!</p>
        ) : !isLastCard ? (
          <p>Continuez à cliquer ou glisser pour révéler la carte suivante</p>
        ) : (
          <p>Félicitations! Vous avez révélé toutes vos cartes!</p>
        )}
      </div>
    </div>
  );
};

export default CardDeck;