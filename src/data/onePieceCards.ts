import { Card, Rarity } from '../types';

// Structure des boosters One Piece réels
export interface BoosterPack {
  id: string;
  name: string;
  code: string;
  series: string;
  description: string;
  releaseDate: string;
  cardCount: number;
  image?: string;
}

// Mapping des raretés One Piece vers notre système
export const RARITY_MAPPING: Record<string, Rarity> = {
  'C': 'common',
  'UC': 'uncommon',
  'R': 'rare',
  'SR': 'super_rare',
  'SEC': 'secret_rare',
  'L': 'super_rare', // Leader cards as super rare
  'SP': 'secret_rare' // Special cards as secret rare
};

// Boosters One Piece disponibles (basés sur les vrais sets)
export const AVAILABLE_BOOSTERS: BoosterPack[] = [
  {
    id: 'st01',
    name: 'Starter Deck - Straw Hat Crew',
    code: 'ST-01',
    series: 'Starter Deck',
    description: 'Le deck de départ des Chapeaux de Paille avec Luffy en leader',
    releaseDate: '2022-07-08',
    cardCount: 51,
    image: '/boosters/st01.jpg'
  },
  {
    id: 'op01',
    name: 'Romance Dawn',
    code: 'OP-01',
    series: 'Booster Pack',
    description: 'Le premier booster pack avec les personnages iconiques de Romance Dawn',
    releaseDate: '2022-07-08',
    cardCount: 121,
    image: '/boosters/op01.jpg'
  },
  {
    id: 'op02',
    name: 'Paramount War',
    code: 'OP-02',
    series: 'Booster Pack',
    description: 'La guerre de Marineford avec Ace, Barbe Blanche et les Marines',
    releaseDate: '2022-09-30',
    cardCount: 121,
    image: '/boosters/op02.jpg'
  },
  {
    id: 'op03',
    name: 'Pillars of Strength',
    code: 'OP-03',
    series: 'Booster Pack',
    description: 'Les piliers de la force avec Crocodile et les Shichibukai',
    releaseDate: '2022-12-02',
    cardCount: 121,
    image: '/boosters/op03.jpg'
  },
  {
    id: 'op04',
    name: 'Kingdoms of Intrigue',
    code: 'OP-04',
    series: 'Booster Pack',
    description: 'Les royaumes et intrigues avec Doflamingo et Dressrosa',
    releaseDate: '2023-02-25',
    cardCount: 121,
    image: '/boosters/op04.jpg'
  },
  {
    id: 'op05',
    name: 'Awakening of the New Era',
    code: 'OP-05',
    series: 'Booster Pack',
    description: 'L\'éveil de la nouvelle ère avec les Empereurs',
    releaseDate: '2023-06-30',
    cardCount: 121,
    image: '/boosters/op05.jpg'
  }
];

// Cartes One Piece réelles (exemples avec vraies données)
export const REAL_ONE_PIECE_CARDS: Card[] = [
  // ST-01 Straw Hat Crew
  {
    id: 'ST01-001',
    name: 'Monkey D. Luffy',
    character: 'Monkey D. Luffy',
    rarity: 'super_rare',
    attack: 5000,
    defense: 1000,
    description: 'Leader des Chapeaux de Paille. Son rêve est de devenir le Roi des Pirates.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/ST01-001.png',
    special_ability: '[Activate: Main] [Once Per Turn] Give up to 1 of your Leader or Character cards +1000 power during this turn.',
    cost: 0,
    power: 5000,
    counter: 1000,
    color: ['Red'],
    type: 'Leader',
    booster_id: 'st01'
  },
  {
    id: 'ST01-002',
    name: 'Roronoa Zoro',
    character: 'Roronoa Zoro',
    rarity: 'rare',
    attack: 4000,
    defense: 1000,
    description: 'Bretteur des Chapeaux de Paille qui manie trois sabres.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/ST01-002.png',
    special_ability: '[DON!! x1] [When Attacking] If you have 2 or less Life cards, this Character gains +2000 power during this battle.',
    cost: 3,
    power: 4000,
    counter: 1000,
    color: ['Red'],
    type: 'Character',
    booster_id: 'st01'
  },
  {
    id: 'ST01-003',
    name: 'Nami',
    character: 'Nami',
    rarity: 'common',
    attack: 1000,
    defense: 1000,
    description: 'Navigatrice des Chapeaux de Paille, experte en cartographie.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/ST01-003.png',
    special_ability: '[Activate: Main] [Once Per Turn] Look at 3 cards from the top of your deck; reveal up to 1 {Straw Hat Crew} type card other than [Nami] and add it to your hand. Then, place the rest at the bottom of your deck in any order.',
    cost: 1,
    power: 1000,
    counter: 1000,
    color: ['Red'],
    type: 'Character',
    booster_id: 'st01'
  },

  // OP-01 Romance Dawn
  {
    id: 'OP01-001',
    name: 'Monkey D. Luffy',
    character: 'Monkey D. Luffy',
    rarity: 'super_rare',
    attack: 6000,
    defense: 1000,
    description: 'Version Leader de Romance Dawn avec une puissance accrue.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
    special_ability: '[Activate: Main] [Once Per Turn] Give up to 1 of your Leader or Character cards +1000 power during this turn. Then, if you have 2 or less Life cards, draw 1 card.',
    cost: 0,
    power: 6000,
    counter: 1000,
    color: ['Red'],
    type: 'Leader',
    booster_id: 'op01'
  },
  {
    id: 'OP01-025',
    name: 'Monkey D. Luffy (Gear 4)',
    character: 'Monkey D. Luffy',
    rarity: 'secret_rare',
    attack: 10000,
    defense: 0,
    description: 'Luffy utilise son Gear Fourth Boundman.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/OP01-025.png',
    special_ability: '[Rush] (This card can attack on the turn in which it is played.) [Blocker] (After your opponent declares an attack, you may rest this card to make it the new target of the attack.) [Activate: Main] [Once Per Turn] K.O. up to 1 of your opponent\'s Characters with a cost of 3 or less.',
    cost: 8,
    power: 10000,
    counter: 0,
    color: ['Red'],
    type: 'Character',
    booster_id: 'op01'
  },
  {
    id: 'OP01-003',
    name: 'Roronoa Zoro',
    character: 'Roronoa Zoro',
    rarity: 'super_rare',
    attack: 6000,
    defense: 0,
    description: 'Version puissante du bretteur aux trois sabres.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/OP01-003.png',
    special_ability: '[Blocker] (After your opponent declares an attack, you may rest this card to make it the new target of the attack.) [Activate: Main] [Once Per Turn] K.O. up to 1 of your opponent\'s Characters with a cost of 3 or less.',
    cost: 5,
    power: 6000,
    counter: 0,
    color: ['Red'],
    type: 'Character',
    booster_id: 'op01'
  },

  // OP-02 Paramount War
  {
    id: 'OP02-001',
    name: 'Edward Newgate',
    character: 'Edward Newgate',
    rarity: 'secret_rare',
    attack: 5000,
    defense: 1000,
    description: 'Barbe Blanche, l\'homme le plus fort du monde.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/OP02-001.png',
    special_ability: '[Activate: Main] [Once Per Turn] Give up to 1 of your Leader or Character cards +1000 power during this turn. Then, if your opponent has 6 or more DON!! cards on their field, draw 1 card.',
    cost: 0,
    power: 5000,
    counter: 1000,
    color: ['White'],
    type: 'Leader',
    booster_id: 'op02'
  },
  {
    id: 'OP02-013',
    name: 'Portgas D. Ace',
    character: 'Portgas D. Ace',
    rarity: 'super_rare',
    attack: 5000,
    defense: 1000,
    description: 'Commandant de la 2e division de Barbe Blanche.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/OP02-013.png',
    special_ability: '[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Whitebeard Pirates} type card and add it to your hand. Then, place the rest at the bottom of your deck in any order.',
    cost: 4,
    power: 5000,
    counter: 1000,
    color: ['Red'],
    type: 'Character',
    booster_id: 'op02'
  },
  {
    id: 'OP02-004',
    name: 'Marco',
    character: 'Marco',
    rarity: 'rare',
    attack: 4000,
    defense: 1000,
    description: 'Commandant de la 1ère division des Pirates de Barbe Blanche.',
    image_url: 'https://images.onepiece-cardgame.com/images/cardlist/card/OP02-004.png',
    special_ability: '[Blocker] (After your opponent declares an attack, you may rest this card to make it the new target of the attack.) [On Play] If your Leader\'s type includes "Whitebeard Pirates", draw 1 card.',
    cost: 4,
    power: 4000,
    counter: 1000,
    color: ['Blue'],
    type: 'Character',
    booster_id: 'op02'
  }
];

// Extension des types pour les cartes One Piece
declare module '../types' {
  interface Card {
    cost?: number;
    power?: number;
    counter?: number;
    color?: string[];
    type?: string;
    booster_id?: string;
  }
}