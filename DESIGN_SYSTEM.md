# 🎨 Système de Design - One Piece TCG

## Vue d'ensemble

Ce document décrit le système de design standardisé et cohérent pour l'application One Piece TCG. Le design est **minimaliste, moderne et inspiré de l'univers One Piece**, avec des touches de gaming pour une expérience utilisateur optimale.

---

## 🎨 Palette de Couleurs

### Couleurs Principales

#### Ocean (Bleu - Grand Line)
Utilisé pour les éléments principaux, les actions primaires et la navigation.
- `ocean-50` à `ocean-950` : Nuances de bleu océan
- Usage : Boutons primaires, liens actifs, éléments interactifs

#### Treasure (Or/Ambre - Trésors)
Utilisé pour les récompenses, achievements et éléments premium.
- `treasure-50` à `treasure-900` : Nuances or/ambre
- Usage : Récompenses quotidiennes, éléments spéciaux, highlights

#### Danger (Rouge - Aventure)
Utilisé pour les alertes, actions destructives et éléments d'urgence.
- `danger-50` à `danger-900` : Nuances de rouge
- Usage : Boutons de suppression, alertes, notifications importantes

### Couleurs Secondaires

- **Slate** : Arrière-plans, cartes, surfaces
- **Emerald** : Succès, collection, progression
- **Purple** : Administration, éléments premium

---

## 📐 Composants Réutilisables

### Button (src/components/ui/Button.tsx)

Bouton standardisé avec plusieurs variantes et tailles.

**Variantes :**
- `primary` : Actions principales (bleu océan)
- `secondary` : Actions secondaires (gris ardoise)
- `danger` : Actions destructives (rouge)
- `treasure` : Actions spéciales/récompenses (or)
- `ghost` : Actions subtiles (transparent)

**Tailles :**
- `sm` : Petit (px-3 py-1.5)
- `md` : Moyen (px-6 py-3) - **par défaut**
- `lg` : Grand (px-8 py-4)

**Props :**
- `isLoading` : Affiche un spinner de chargement
- `leftIcon` / `rightIcon` : Icônes à gauche/droite
- `disabled` : Désactive le bouton

**Exemple :**
```tsx
import { Button } from '../components/ui';

<Button variant="treasure" size="lg" leftIcon={<Gift />}>
  Réclamer
</Button>
```

### GameCard (src/components/ui/GameCard.tsx)

Carte glassmorphique avec effet de survol.

**Variantes :**
- `default` : Carte standard (ardoise)
- `ocean` : Carte bleue
- `treasure` : Carte dorée
- `danger` : Carte rouge
- `success` : Carte verte

**Props :**
- `hover` : Active l'effet de survol (défaut: true)
- `glow` : Ajoute un effet de lueur (défaut: false)

**Exemple :**
```tsx
import { GameCard } from '../components/ui';

<GameCard variant="ocean" glow className="p-6">
  <h2>Contenu de la carte</h2>
</GameCard>
```

### ProgressBar (src/components/ui/ProgressBar.tsx)

Barre de progression animée.

**Variantes :**
- `ocean`, `treasure`, `success`, `danger`

**Props :**
- `value` : Valeur actuelle
- `max` : Valeur maximale (défaut: 100)
- `showLabel` : Affiche le pourcentage
- `label` : Label personnalisé
- `animated` : Animation fluide (défaut: true)

**Exemple :**
```tsx
import { ProgressBar } from '../components/ui';

<ProgressBar
  value={75}
  variant="success"
  showLabel
  label="Progression"
/>
```

### StatDisplay (src/components/ui/StatDisplay.tsx)

Affichage de statistiques avec icône.

**Variantes :**
- `default`, `ocean`, `treasure`, `success`, `danger`

**Tailles :**
- `sm`, `md`, `lg`

**Exemple :**
```tsx
import { StatDisplay } from '../components/ui';
import { TrendingUp } from 'lucide-react';

<StatDisplay
  icon={<TrendingUp />}
  label="Cartes"
  value={150}
  variant="ocean"
/>
```

---

## 🎭 Principes de Design

### 1. Glassmorphism
Utiliser le glassmorphism pour les cartes et surfaces :
- `backdrop-blur-md` ou `backdrop-blur-xl`
- Arrière-plans semi-transparents (`bg-slate-800/40`)
- Bordures subtiles (`border-slate-700/50`)

### 2. Animations Fluides
Toujours ajouter des transitions :
- `transition-all duration-300` pour les interactions
- Animations de hover : `hover:scale-105`
- Ombres dynamiques : `hover:shadow-2xl`

### 3. Espacements Cohérents
Utiliser l'échelle Tailwind :
- Petits : `gap-2`, `p-2`
- Moyens : `gap-4`, `p-4`
- Grands : `gap-6`, `p-6`
- Extra-grands : `gap-8`, `p-8`

### 4. Typographie
- **Titres** : `text-2xl` à `text-4xl`, `font-bold`
- **Sous-titres** : `text-lg` à `text-xl`, `font-semibold`
- **Corps** : `text-base`, `font-medium`
- **Labels** : `text-sm` à `text-xs`, `font-medium`, `uppercase`

### 5. Responsive
Utiliser les breakpoints Tailwind :
- `sm:` : 640px et plus
- `md:` : 768px et plus
- `lg:` : 1024px et plus
- `xl:` : 1280px et plus

---

## 🎮 Thème Gaming

### Icônes
Utiliser **lucide-react** pour toutes les icônes :
```tsx
import { Package, BookOpen, Trophy, Gift } from 'lucide-react';
```

### Emojis Thématiques
Utiliser des emojis pour renforcer le thème One Piece :
- 🏴‍☠️ : Logo principal, piraterie
- ⚓ : Navigation, aventure
- 💎 : Cartes rares
- 🎁 : Récompenses
- 🏆 : Achievements
- 🎲 : Boosters

### Effets Visuels
- **Glow effects** pour les éléments importants
- **Float animation** pour les icônes : `animate-float`
- **Shimmer** pour les éléments premium : `animate-shimmer`
- **Pulse** pour les notifications : `animate-pulse-slow`

---

## 📝 Conventions de Code

### Import des Composants
```tsx
import { Button, GameCard, ProgressBar, StatDisplay } from '../components/ui';
```

### Structure d'une Carte
```tsx
<GameCard variant="ocean" className="p-6">
  {/* En-tête avec icône */}
  <div className="flex items-center space-x-3 mb-4">
    <div className="p-2 bg-ocean-500/20 rounded-xl">
      <Package className="text-ocean-300" size={24} />
    </div>
    <h2 className="text-xl font-bold text-white">Titre</h2>
  </div>

  {/* Contenu */}
  <div className="space-y-3">
    {/* ... */}
  </div>
</GameCard>
```

### Boutons avec Liens
```tsx
<Link to="/boosters" className="block w-full">
  <Button variant="primary" className="w-full">
    Ouvrir Booster
  </Button>
</Link>
```

---

## 🚀 Quick Start

### 1. Utiliser le Système de Couleurs
```tsx
// Au lieu de :
className="bg-blue-500 text-white"

// Utiliser :
className="bg-ocean-500 text-white"
```

### 2. Utiliser les Composants Réutilisables
```tsx
// Au lieu de créer un bouton custom :
<button className="bg-blue-500 px-6 py-3 rounded-xl...">

// Utiliser le composant Button :
<Button variant="primary">Action</Button>
```

### 3. Maintenir la Cohérence
- Toujours utiliser `rounded-xl` pour les grandes surfaces
- Toujours ajouter `transition-all duration-300` aux éléments interactifs
- Toujours utiliser les variantes de couleurs définies (ocean, treasure, etc.)

---

## 📦 Fichiers Importants

- `tailwind.config.js` : Configuration des couleurs et du thème
- `src/components/ui/` : Composants réutilisables
- `src/index.css` : Styles globaux et classes utilitaires
- `src/pages/Home.tsx` : Exemple d'implémentation

---

## 🎯 Checklist pour Nouvelles Pages

- [ ] Utiliser `GameCard` pour les conteneurs principaux
- [ ] Utiliser `Button` pour toutes les actions
- [ ] Utiliser `ProgressBar` pour les progressions
- [ ] Ajouter des animations de hover (`hover:scale-105`)
- [ ] Utiliser les couleurs du système (ocean, treasure, etc.)
- [ ] Tester la responsivité (mobile, tablette, desktop)
- [ ] Ajouter des emojis thématiques appropriés
- [ ] Vérifier l'accessibilité (focus states, contraste)

---

**Dernière mise à jour** : Octobre 2025
**Version** : 1.0.0
