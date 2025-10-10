import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Card as CardType } from '../types';

interface ChestAnimation3DProps {
  isOpening: boolean;
  animationPhase: 'idle' | 'opening' | 'deck' | 'revealing' | 'complete';
  cards?: CardType[];
  onAnimationComplete?: () => void;
  onClick?: () => void;
}

// Composant du coffre 3D
function Chest({ isOpening, onClick }: { isOpening: boolean; onClick?: () => void }) {
  const chestRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Animation du coffre
  useFrame((state) => {
    if (chestRef.current) {
      // Rotation subtile quand idle
      if (!isOpening) {
        chestRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        chestRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      }
    }

    // Animation du couvercle qui s'ouvre
    if (lidRef.current && isOpening) {
      const targetRotation = -Math.PI / 2.5; // Angle d'ouverture
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetRotation,
        0.05
      );
    } else if (lidRef.current && !isOpening) {
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        0,
        0.05
      );
    }

    // Animation de la lumière
    if (lightRef.current) {
      if (isOpening) {
        lightRef.current.intensity = THREE.MathUtils.lerp(
          lightRef.current.intensity,
          8,
          0.08
        );
      } else {
        lightRef.current.intensity = THREE.MathUtils.lerp(
          lightRef.current.intensity,
          0,
          0.05
        );
      }
    }
  });

  // Matériaux du coffre
  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8B4513',
        roughness: 0.7,
        metalness: 0.1,
      }),
    []
  );

  const metalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#D4AF37',
        roughness: 0.3,
        metalness: 0.9,
      }),
    []
  );

  const gemMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FF6B35',
        emissive: '#FF6B35',
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.8,
      }),
    []
  );

  return (
    <group ref={chestRef} onClick={onClick}>
      {/* Lumière dorée sortant du coffre */}
      <pointLight
        ref={lightRef}
        position={[0, 0.5, 0]}
        color="#FFD700"
        intensity={0}
        distance={10}
        decay={2}
      />

      {/* Particules lumineuses */}
      {isOpening && (
        <pointLight
          position={[0, 1, 0]}
          color="#FFA500"
          intensity={3}
          distance={8}
        />
      )}

      {/* Base du coffre */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={woodMaterial}>
        <boxGeometry args={[2, 1.2, 1.5]} />
      </mesh>

      {/* Bandes métalliques sur la base */}
      <mesh position={[0, 0.3, 0.76]} material={metalMaterial}>
        <boxGeometry args={[2.05, 0.1, 0.05]} />
      </mesh>
      <mesh position={[0, 0.3, -0.76]} material={metalMaterial}>
        <boxGeometry args={[2.05, 0.1, 0.05]} />
      </mesh>
      <mesh position={[0, -0.3, 0.76]} material={metalMaterial}>
        <boxGeometry args={[2.05, 0.1, 0.05]} />
      </mesh>
      <mesh position={[0, -0.3, -0.76]} material={metalMaterial}>
        <boxGeometry args={[2.05, 0.1, 0.05]} />
      </mesh>

      {/* Couvercle du coffre (pivote sur l'axe X) */}
      <group position={[0, 0.6, 0]}>
        <mesh
          ref={lidRef}
          position={[0, 0.4, 0]}
          rotation={[0, 0, 0]}
          castShadow
          receiveShadow
          material={woodMaterial}
        >
          <boxGeometry args={[2, 0.8, 1.5]} />

          {/* Bandes métalliques sur le couvercle */}
          <mesh position={[0, 0, 0.76]} material={metalMaterial}>
            <boxGeometry args={[2.05, 0.05, 0.05]} />
          </mesh>
          <mesh position={[0, 0, -0.76]} material={metalMaterial}>
            <boxGeometry args={[2.05, 0.05, 0.05]} />
          </mesh>

          {/* Serrure avec gemme */}
          <mesh position={[0, 0, 0.76]} material={metalMaterial}>
            <boxGeometry args={[0.3, 0.4, 0.1]} />
          </mesh>
          <mesh position={[0, 0, 0.82]} material={gemMaterial}>
            <dodecahedronGeometry args={[0.15, 0]} />
          </mesh>
        </mesh>
      </group>

      {/* Coins métalliques */}
      {[
        [-0.95, -0.55, 0.7],
        [0.95, -0.55, 0.7],
        [-0.95, -0.55, -0.7],
        [0.95, -0.55, -0.7],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} material={metalMaterial}>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>
      ))}
    </group>
  );
}

// Composant pour une carte 3D
function Card3D({
  card,
  position,
  delay,
  index
}: {
  card: CardType;
  position: [number, number, number];
  delay: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number>(0);
  const [hasStarted, setHasStarted] = React.useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;

    const elapsedTime = state.clock.elapsedTime;

    if (!hasStarted && elapsedTime > delay) {
      startTime.current = elapsedTime;
      setHasStarted(true);
    }

    if (hasStarted) {
      const timeSinceStart = elapsedTime - startTime.current;
      const duration = 1.5; // Durée de l'animation
      const progress = Math.min(timeSinceStart / duration, 1);

      // Animation de sortie du coffre vers le haut
      if (progress < 1) {
        // Position: sort du coffre (y=0) vers la position finale
        meshRef.current.position.y = THREE.MathUtils.lerp(0, position[1], progress);
        meshRef.current.position.x = THREE.MathUtils.lerp(0, position[0], progress);
        meshRef.current.position.z = THREE.MathUtils.lerp(0, position[2], progress);

        // Rotation pendant la montée
        meshRef.current.rotation.y = progress * Math.PI * 2;
        meshRef.current.rotation.x = Math.sin(progress * Math.PI) * 0.5;
      } else {
        // Position finale atteinte
        meshRef.current.position.set(...position);
        // Rotation douce en position finale
        meshRef.current.rotation.y = elapsedTime * 0.5;
        meshRef.current.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1;
      }

      // Scale animation
      if (timeSinceStart < 1.5) {
        const scaleProgress = Math.min(timeSinceStart / 0.5, 1);
        const scale = THREE.MathUtils.lerp(0, 1, scaleProgress);
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    } else {
      // Avant le démarrage, reste au centre du coffre
      meshRef.current.position.set(0, 0, 0);
      meshRef.current.scale.set(0, 0, 0);
    }
  });

  // Couleur selon la rareté
  const rarityColor = {
    common: '#CCCCCC',
    uncommon: '#4ADE80',
    rare: '#3B82F6',
    super_rare: '#A855F7',
    secret_rare: '#FBBF24',
  }[card.rarity] || '#CCCCCC';

  return (
    <mesh ref={meshRef} position={position} castShadow>
      {/* Carte rectangulaire */}
      <boxGeometry args={[0.6, 0.9, 0.02]} />
      <meshStandardMaterial
        color={rarityColor}
        emissive={rarityColor}
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.6}
      />
    </mesh>
  );
}

// Composant principal de la scène 3D
function Scene({
  isOpening,
  cards,
  animationPhase,
  onClick
}: {
  isOpening: boolean;
  cards?: CardType[];
  animationPhase: string;
  onClick?: () => void;
}) {
  // Positions des cartes en cercle autour du coffre
  const cardPositions: [number, number, number][] = useMemo(() => {
    if (!cards) return [];
    const radius = 3;
    return cards.map((_, i) => {
      const angle = (i / cards.length) * Math.PI * 2;
      return [
        Math.cos(angle) * radius,
        2 + i * 0.3,
        Math.sin(angle) * radius,
      ];
    });
  }, [cards]);

  return (
    <>
      {/* Caméra */}
      <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={50} />

      {/* Contrôles (désactivés pendant l'ouverture) */}
      <OrbitControls
        enabled={!isOpening && animationPhase === 'idle'}
        enablePan={false}
        minDistance={4}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Lumières de la scène */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#4A90E2" />

      {/* Coffre */}
      <Chest isOpening={isOpening} onClick={onClick} />

      {/* Cartes (affichées pendant l'animation deck) */}
      {animationPhase === 'deck' && cards && cards.map((card, i) => (
        <Card3D
          key={`${card.id}-${i}`}
          card={card}
          position={cardPositions[i]}
          delay={i * 0.3 + 2} // Délai progressif pour chaque carte
          index={i}
        />
      ))}

      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Brouillard pour l'ambiance */}
      <fog attach="fog" args={['#0f172a', 5, 15]} />
    </>
  );
}

// Composant principal exporté
const ChestAnimation3D: React.FC<ChestAnimation3DProps> = ({
  isOpening,
  animationPhase,
  cards,
  onAnimationComplete,
  onClick,
}) => {
  return (
    <div className="w-full h-[600px] relative">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl"
      >
        <Scene
          isOpening={isOpening}
          cards={cards}
          animationPhase={animationPhase}
          onClick={onClick}
        />
      </Canvas>

      {/* Instructions */}
      {animationPhase === 'idle' && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/70 text-sm">
            🖱️ Utilisez la souris pour faire pivoter la vue
          </p>
        </div>
      )}
    </div>
  );
};

export default ChestAnimation3D;
