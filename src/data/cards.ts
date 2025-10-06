import { Card } from '../types';

export const testCards: Card[] = [
  // Cartes Communes (60%)
  {
    id: 'luffy-gear2',
    name: 'Luffy Gear 2',
    character: 'Monkey D. Luffy',
    rarity: 'common',
    attack: 150,
    defense: 100,
    description: 'Le capitaine des Chapeaux de Paille utilise sa technique Gear Second pour augmenter sa vitesse.',
    special_ability: 'Vitesse augmentée pendant 2 tours'
  },
  {
    id: 'zoro-trois-sabres',
    name: 'Zoro Trois Sabres',
    character: 'Roronoa Zoro',
    rarity: 'common',
    attack: 140,
    defense: 110,
    description: 'Le bretteur aux trois sabres des Chapeaux de Paille dans sa stance de combat classique.',
    special_ability: 'Attaque triple'
  },
  {
    id: 'nami-clima-tact',
    name: 'Nami Clima-Tact',
    character: 'Nami',
    rarity: 'common',
    attack: 80,
    defense: 120,
    description: 'La navigatrice utilise son Clima-Tact pour contrôler la météo.',
    special_ability: 'Contrôle météorologique'
  },
  {
    id: 'usopp-tireur',
    name: 'Usopp Tireur',
    character: 'Usopp',
    rarity: 'common',
    attack: 100,
    defense: 80,
    description: 'Le tireur d\'élite des Chapeaux de Paille avec sa fronde.',
    special_ability: 'Tir précis à distance'
  },
  {
    id: 'chopper-medecin',
    name: 'Chopper Médecin',
    character: 'Tony Tony Chopper',
    rarity: 'common',
    attack: 70,
    defense: 90,
    description: 'Le médecin renne des Chapeaux de Paille prêt à soigner ses alliés.',
    special_ability: 'Soins d\'équipe'
  },

  // Cartes Peu Communes (25%)
  {
    id: 'sanji-jambe-noir',
    name: 'Sanji Jambe Noir',
    character: 'Sanji',
    rarity: 'uncommon',
    attack: 130,
    defense: 105,
    description: 'Le cuisinier des Chapeaux de Paille utilise ses techniques de combat au pied.',
    special_ability: 'Combo de coups de pied'
  },
  {
    id: 'robin-fleur',
    name: 'Robin Mille Fleur',
    character: 'Nico Robin',
    rarity: 'uncommon',
    attack: 110,
    defense: 125,
    description: 'L\'archéologue utilise son pouvoir pour faire pousser des bras.',
    special_ability: 'Multiplication des membres'
  },
  {
    id: 'franky-cyborg',
    name: 'Franky Cyborg',
    character: 'Franky',
    rarity: 'uncommon',
    attack: 160,
    defense: 140,
    description: 'Le charpentier cyborg avec ses modifications mécaniques.',
    special_ability: 'Attaque laser'
  },
  {
    id: 'brook-musicien',
    name: 'Brook Soul King',
    character: 'Brook',
    rarity: 'uncommon',
    attack: 120,
    defense: 95,
    description: 'Le musicien squelette avec son épée et sa musique.',
    special_ability: 'Mélodie hypnotique'
  },

  // Cartes Rares (10%)
  {
    id: 'luffy-gear4',
    name: 'Luffy Gear 4',
    character: 'Monkey D. Luffy',
    rarity: 'rare',
    attack: 220,
    defense: 180,
    description: 'Luffy utilise sa transformation Gear Fourth Boundman.',
    special_ability: 'King Kong Gun'
  },
  {
    id: 'zoro-ashura',
    name: 'Zoro Ashura',
    character: 'Roronoa Zoro',
    rarity: 'rare',
    attack: 210,
    defense: 190,
    description: 'Zoro libère son esprit démonique Ashura avec neuf sabres.',
    special_ability: 'Ashura: Ichibugin'
  },
  {
    id: 'sanji-diable-jambe',
    name: 'Sanji Diable Jambe',
    character: 'Sanji',
    rarity: 'rare',
    attack: 180,
    defense: 160,
    description: 'Sanji enflamme sa jambe pour des attaques dévastatrices.',
    special_ability: 'Bien Cuit: Grill Shot'
  },
  {
    id: 'ace-feu',
    name: 'Portgas D. Ace',
    character: 'Portgas D. Ace',
    rarity: 'rare',
    attack: 200,
    defense: 170,
    description: 'Le possesseur du Mera Mera no Mi, frère adoptif de Luffy.',
    special_ability: 'Hiken (Poing de Feu)'
  },

  // Cartes Super Rares (4%)
  {
    id: 'luffy-gear5',
    name: 'Luffy Gear 5',
    character: 'Monkey D. Luffy',
    rarity: 'super_rare',
    attack: 300,
    defense: 250,
    description: 'L\'éveil du fruit de Luffy révèle sa vraie nature: le Hito Hito no Mi modèle Nika.',
    special_ability: 'Liberation: Rubber Reality'
  },
  {
    id: 'shanks-empereur',
    name: 'Shanks Empereur',
    character: 'Shanks',
    rarity: 'super_rare',
    attack: 280,
    defense: 270,
    description: 'L\'Empereur aux cheveux rouges, mentor de Luffy.',
    special_ability: 'Haki du Roi Conquérant'
  },
  {
    id: 'mihawk-yoru',
    name: 'Dracule Mihawk',
    character: 'Dracule Mihawk',
    rarity: 'super_rare',
    attack: 290,
    defense: 240,
    description: 'Le plus grand épéiste du monde avec son sabre noir Yoru.',
    special_ability: 'Tranche-monde'
  },

  // Cartes Secrètes Rares (1%)
  {
    id: 'roger-roi-pirates',
    name: 'Gol D. Roger Roi des Pirates',
    character: 'Gol D. Roger',
    rarity: 'secret_rare',
    attack: 350,
    defense: 300,
    description: 'Le légendaire Roi des Pirates qui a conquis Grand Line.',
    special_ability: 'Divine Departure'
  },
  {
    id: 'barbe-blanche-tremblements',
    name: 'Edward Newgate Barbe Blanche',
    character: 'Edward Newgate',
    rarity: 'secret_rare',
    attack: 340,
    defense: 320,
    description: 'L\'homme le plus fort du monde avec le pouvoir des tremblements.',
    special_ability: 'Gura Gura: Séisme Mondial'
  }
];

export const RARITY_DISTRIBUTION = {
  common: 0.60,      // 60%
  uncommon: 0.25,    // 25%
  rare: 0.10,        // 10%
  super_rare: 0.04,  // 4%
  secret_rare: 0.01  // 1%
};

export const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  super_rare: 'from-purple-400 to-purple-600',
  secret_rare: 'from-yellow-400 to-orange-500'
};

export const RARITY_LABELS = {
  common: 'Commune',
  uncommon: 'Peu Commune',
  rare: 'Rare',
  super_rare: 'Super Rare',
  secret_rare: 'Secrète Rare'
};