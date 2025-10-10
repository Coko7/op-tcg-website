# 🎨 Composants UI - One Piece TCG

## Introduction

Ces composants réutilisables permettent de maintenir une interface cohérente et moderne dans toute l'application.

---

## 📦 Import

```tsx
// Import individuel
import Button from './components/ui/Button';
import GameCard from './components/ui/GameCard';

// Import groupé (recommandé)
import { Button, GameCard, ProgressBar, StatDisplay } from './components/ui';
```

---

## 🔘 Button

Bouton standardisé avec variantes et états.

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'treasure' \| 'ghost'` | `'primary'` | Style du bouton |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille du bouton |
| `isLoading` | `boolean` | `false` | Affiche un spinner |
| `leftIcon` | `ReactNode` | - | Icône à gauche |
| `rightIcon` | `ReactNode` | - | Icône à droite |
| `disabled` | `boolean` | `false` | Désactive le bouton |

### Exemples

```tsx
// Bouton basique
<Button>Cliquez-moi</Button>

// Bouton avec variante
<Button variant="treasure" size="lg">
  Récompense
</Button>

// Bouton avec icône
<Button variant="primary" leftIcon={<Package />}>
  Ouvrir Booster
</Button>

// Bouton en chargement
<Button isLoading>
  Chargement...
</Button>

// Dans un Link
<Link to="/collection">
  <Button variant="primary" className="w-full">
    Voir Collection
  </Button>
</Link>
```

---

## 🃏 GameCard

Carte avec effet glassmorphism et variantes de couleur.

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `'default' \| 'ocean' \| 'treasure' \| 'danger' \| 'success'` | `'default'` | Style de la carte |
| `hover` | `boolean` | `true` | Active l'effet de survol |
| `glow` | `boolean` | `false` | Ajoute un effet de lueur |
| `className` | `string` | - | Classes CSS additionnelles |

### Exemples

```tsx
// Carte basique
<GameCard variant="ocean" className="p-6">
  <h2>Titre</h2>
  <p>Contenu</p>
</GameCard>

// Carte avec effet glow
<GameCard variant="treasure" glow className="p-8">
  <div className="text-center">
    <h2>Récompense Spéciale</h2>
  </div>
</GameCard>

// Structure recommandée
<GameCard variant="ocean" className="p-6">
  {/* En-tête */}
  <div className="flex items-center space-x-3 mb-4">
    <div className="p-2 bg-ocean-500/20 rounded-xl">
      <Package className="text-ocean-300" size={24} />
    </div>
    <h2 className="text-xl font-bold text-white">Boosters</h2>
  </div>

  {/* Contenu */}
  <div className="space-y-3">
    {/* ... */}
  </div>
</GameCard>
```

---

## 📊 ProgressBar

Barre de progression animée.

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `value` | `number` | - | Valeur actuelle (requis) |
| `max` | `number` | `100` | Valeur maximale |
| `variant` | `'ocean' \| 'treasure' \| 'success' \| 'danger'` | `'ocean'` | Couleur de la barre |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Hauteur de la barre |
| `showLabel` | `boolean` | `false` | Affiche le pourcentage |
| `label` | `string` | - | Label au-dessus de la barre |
| `animated` | `boolean` | `true` | Animation de remplissage |

### Exemples

```tsx
// Barre de progression simple
<ProgressBar value={75} variant="success" />

// Avec label et pourcentage
<ProgressBar
  value={stats.collection_completion}
  variant="success"
  showLabel
  label="Progression de la collection"
/>

// Grande taille
<ProgressBar
  value={experience}
  max={1000}
  variant="ocean"
  size="lg"
/>
```

---

## 📈 StatDisplay

Affichage de statistique avec icône.

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `icon` | `ReactNode` | - | Icône (requis) |
| `label` | `string` | - | Label (requis) |
| `value` | `string \| number` | - | Valeur (requis) |
| `variant` | `'default' \| 'ocean' \| 'treasure' \| 'success' \| 'danger'` | `'default'` | Style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille |

### Exemples

```tsx
import { TrendingUp, Users, Star } from 'lucide-react';

// Stat simple
<StatDisplay
  icon={<TrendingUp />}
  label="Score"
  value={1250}
  variant="ocean"
/>

// Grille de stats
<div className="grid grid-cols-3 gap-4">
  <StatDisplay
    icon={<Users />}
    label="Joueurs"
    value="1.2K"
    variant="success"
    size="sm"
  />
  <StatDisplay
    icon={<Star />}
    label="Niveau"
    value={42}
    variant="treasure"
    size="sm"
  />
  <StatDisplay
    icon={<TrendingUp />}
    label="Rang"
    value="#15"
    variant="ocean"
    size="sm"
  />
</div>
```

---

## 🎨 Variantes de Couleurs

### Ocean (Bleu)
Pour les éléments principaux, navigation, actions primaires
```tsx
<Button variant="primary" />
<GameCard variant="ocean" />
<ProgressBar variant="ocean" />
```

### Treasure (Or/Ambre)
Pour les récompenses, éléments spéciaux, achievements
```tsx
<Button variant="treasure" />
<GameCard variant="treasure" />
<ProgressBar variant="treasure" />
```

### Success (Vert)
Pour la progression, succès, collection
```tsx
<GameCard variant="success" />
<ProgressBar variant="success" />
<StatDisplay variant="success" />
```

### Danger (Rouge)
Pour les alertes, actions destructives
```tsx
<Button variant="danger" />
<GameCard variant="danger" />
<ProgressBar variant="danger" />
```

---

## 💡 Bonnes Pratiques

### 1. Utiliser les composants de manière cohérente

```tsx
// ✅ BON
<Link to="/boosters">
  <Button variant="primary" className="w-full">
    Ouvrir Booster
  </Button>
</Link>

// ❌ ÉVITER
<Link to="/boosters" className="bg-blue-500 px-6 py-3...">
  Ouvrir Booster
</Link>
```

### 2. Respecter la hiérarchie des variantes

- `primary` : Action principale de la page
- `secondary` : Actions secondaires
- `treasure` : Actions spéciales/récompenses
- `danger` : Actions destructives
- `ghost` : Actions subtiles

### 3. Grouper les imports

```tsx
// ✅ BON
import { Button, GameCard, ProgressBar } from '../components/ui';

// ❌ ÉVITER
import Button from '../components/ui/Button';
import GameCard from '../components/ui/GameCard';
import ProgressBar from '../components/ui/ProgressBar';
```

### 4. Utiliser className pour personnaliser

```tsx
// Ajouter des classes sans modifier le composant
<Button variant="primary" className="w-full mt-4">
  Action
</Button>

<GameCard variant="ocean" className="p-8 max-w-2xl">
  Contenu
</GameCard>
```

---

## 🎯 Patterns Communs

### Section avec Titre et Action

```tsx
<GameCard variant="ocean" className="p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-ocean-500/20 rounded-xl">
        <Package size={24} className="text-ocean-300" />
      </div>
      <h2 className="text-xl font-bold text-white">Boosters</h2>
    </div>
    <Button variant="primary" size="sm">
      Voir tout
    </Button>
  </div>
  {/* Contenu */}
</GameCard>
```

### Grille de Stats

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  <StatDisplay
    icon={<Package />}
    label="Boosters"
    value={3}
    variant="ocean"
  />
  <StatDisplay
    icon={<BookOpen />}
    label="Cartes"
    value={150}
    variant="success"
  />
  {/* ... */}
</div>
```

### Call-to-Action

```tsx
<GameCard variant="ocean" glow className="p-8 text-center">
  <h2 className="text-2xl font-bold text-white mb-4">
    Prêt pour l'aventure ?
  </h2>
  <p className="text-slate-300 mb-6">
    Description de l'action...
  </p>
  <div className="flex gap-4 justify-center">
    <Button variant="treasure" size="lg">
      Action Principale
    </Button>
    <Button variant="ghost" size="lg">
      Action Secondaire
    </Button>
  </div>
</GameCard>
```

---

## 🔍 TypeScript

Tous les composants sont typés. Vous pouvez importer les types :

```tsx
import { ButtonProps, GameCardProps } from './components/ui';

// Créer un wrapper
const CustomButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} className={`custom-class ${props.className}`} />;
};
```

---

Pour plus d'informations, consultez le fichier `DESIGN_SYSTEM.md` à la racine du projet.
