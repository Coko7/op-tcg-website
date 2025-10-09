export type Rarity = 'common' | 'uncommon' | 'rare' | 'super_rare' | 'secret_rare';

export interface Card {
  id: string;
  name: string;
  character: string;
  rarity: Rarity;
  attack: number;
  defense: number;
  description: string;
  image_url?: string;
  fallback_image_url?: string;
  special_ability?: string;
  // Nouvelles propriétés One Piece TCG
  cost?: number;
  power?: number;
  counter?: number;
  color?: string[];
  type?: string;
  booster_id?: string;
}

export interface UserCard {
  id: string;
  card_id: string;
  quantity: number;
  obtained_at: Date;
  is_favorite: boolean;
}

export interface User {
  id: string;
  username: string;
  created_at: Date;
  last_booster_opened?: Date;
  boosters_opened_today: number;
  total_cards: number;
  unique_cards: number;
  berrys?: number;
  is_admin?: boolean;
}

export interface BoosterStatus {
  available_boosters: number;
  max_daily_boosters: number;
  next_booster_time?: Date;
  time_until_next: number;
}

export interface BoosterResult {
  cards: Card[];
  new_cards: string[];
  available_boosters?: number;
  next_booster_time?: Date | string;
  session_info?: {
    sessionId: string;
    boosterId: string;
    timestamp: number;
    seed: number;
  };
}

export interface RarityDistribution {
  common: number;
  uncommon: number;
  rare: number;
  super_rare: number;
  secret_rare: number;
}

export interface GameStats {
  total_boosters_opened: number;
  rarest_card_obtained: Rarity;
  collection_completion: number;
  favorite_character: string;
}

// Prix de vente des cartes en Berrys selon la rareté
export const CARD_SELL_PRICES: Record<Rarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  super_rare: 150,
  secret_rare: 500,
};

// Prix d'un booster en Berrys
export const BOOSTER_BERRY_PRICE = 100;

// Types pour les achievements
export type AchievementType = 'boosters_opened' | 'unique_cards' | 'booster_cards';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  category: string;
  icon?: string;
  threshold: number;
  reward_berrys: number;
  booster_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface AchievementWithProgress extends Achievement {
  progress: number;
  completed_at?: string;
  is_claimed: boolean;
  claimed_at?: string;
  completion_percentage: number;
}

export interface AchievementStats {
  total: number;
  completed: number;
  claimed: number;
  unclaimed: number;
  total_berrys_earned: number;
  total_berrys_available: number;
}