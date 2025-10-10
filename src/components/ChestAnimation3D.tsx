import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Card as CardType } from '../types';

interface ChestAnimation3DProps {
  isOpening: boolean;
  animationPhase: 'idle' | 'opening' | 'deck' | 'revealing' | 'complete';
  cards?: CardType[];
  onAnimationComplete?: () => void;
  onClick?: () => void;
}

// Composant pour les particules magiques
function MagicParticles({ isActive }: { isActive: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 6 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current || !isActive) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] += 0.02;
      if (positions[i * 3 + 1] > 5) {
        positions[i * 3 + 1] = -1;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  if (!isActive) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#FFD700"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Composant du coffre 3D amélioré avec plus de détails
function Chest({ isOpening, onClick, animationPhase }: {
  isOpening: boolean;
  onClick?: () => void;
  animationPhase: string;
}) {
  const chestRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [opacity, setOpacity] = useState(1);

  // Animation du coffre
  useFrame((state) => {
    if (chestRef.current) {
      // Rotation subtile quand idle
      if (!isOpening && animationPhase === 'idle') {
        chestRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        chestRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      }

      // Transition fluide : le coffre devient transparent et descend
      if (animationPhase === 'deck') {
        const targetOpacity = 0;
        const targetY = -3;
        chestRef.current.position.y = THREE.MathUtils.lerp(
          chestRef.current.position.y,
          targetY,
          0.02
        );
        setOpacity(prev => Math.max(0, prev - 0.01));
      }
    }

    // Animation du couvercle qui s'ouvre
    if (lidRef.current && isOpening) {
      const targetRotation = -Math.PI / 1.8; // Angle d'ouverture plus large
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetRotation,
        0.04
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
          12,
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

  // Matériaux du coffre améliorés
  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6B3410',
        roughness: 0.8,
        metalness: 0.05,
        transparent: true,
        opacity: opacity,
      }),
    [opacity]
  );

  const metalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFD700',
        roughness: 0.2,
        metalness: 1,
        emissive: '#D4AF37',
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: opacity,
      }),
    [opacity]
  );

  const gemMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FF1744',
        emissive: '#FF6B35',
        emissiveIntensity: 0.8,
        roughness: 0.05,
        metalness: 0.9,
        transparent: true,
        opacity: opacity,
      }),
    [opacity]
  );

  const ironMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#888888',
        roughness: 0.4,
        metalness: 0.95,
        transparent: true,
        opacity: opacity,
      }),
    [opacity]
  );

  return (
    <group ref={chestRef} onClick={onClick}>
      {/* Lumières dorées sortant du coffre */}
      <pointLight
        ref={lightRef}
        position={[0, 0.8, 0]}
        color="#FFD700"
        intensity={0}
        distance={12}
        decay={2}
      />

      {/* Particules lumineuses multiples */}
      {isOpening && (
        <>
          <pointLight position={[0, 1.5, 0]} color="#FFA500" intensity={4} distance={10} />
          <pointLight position={[0.5, 1, 0.5]} color="#FFD700" intensity={2} distance={6} />
          <pointLight position={[-0.5, 1, -0.5]} color="#FF6B35" intensity={2} distance={6} />
        </>
      )}

      {/* Base du coffre - plus détaillée */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={woodMaterial}>
        <boxGeometry args={[2.2, 1.3, 1.6]} />
      </mesh>

      {/* Planches de bois détaillées sur la base */}
      {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
        <mesh key={`plank-${i}`} position={[x, 0, 0.81]} material={woodMaterial}>
          <boxGeometry args={[0.5, 1.25, 0.03]} />
        </mesh>
      ))}

      {/* Bandes métalliques horizontales renforcées */}
      {[0.5, 0, -0.5].map((y, i) => (
        <React.Fragment key={`band-h-${i}`}>
          <mesh position={[0, y, 0.81]} material={metalMaterial}>
            <boxGeometry args={[2.25, 0.08, 0.06]} />
          </mesh>
          <mesh position={[0, y, -0.81]} material={metalMaterial}>
            <boxGeometry args={[2.25, 0.08, 0.06]} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Bandes verticales aux coins */}
      {[[-1.05, 0.76], [1.05, 0.76], [-1.05, -0.76], [1.05, -0.76]].map((pos, i) => (
        <mesh
          key={`corner-band-${i}`}
          position={[pos[0], 0, pos[1]]}
          material={ironMaterial}
        >
          <boxGeometry args={[0.08, 1.35, 0.08]} />
        </mesh>
      ))}

      {/* Couvercle du coffre avec plus de détails */}
      <group position={[0, 0.65, 0]}>
        <mesh
          ref={lidRef}
          position={[0, 0.45, 0]}
          rotation={[0, 0, 0]}
          castShadow
          receiveShadow
          material={woodMaterial}
        >
          <boxGeometry args={[2.2, 0.9, 1.6]} />

          {/* Planches sur le couvercle */}
          {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
            <mesh key={`lid-plank-${i}`} position={[x, 0, 0.81]} material={woodMaterial}>
              <boxGeometry args={[0.5, 0.85, 0.03]} />
            </mesh>
          ))}

          {/* Bandes métalliques du couvercle */}
          {[0.3, 0, -0.3].map((y, i) => (
            <React.Fragment key={`lid-band-${i}`}>
              <mesh position={[0, y, 0.81]} material={metalMaterial}>
                <boxGeometry args={[2.25, 0.06, 0.06]} />
              </mesh>
              <mesh position={[0, y, -0.81]} material={metalMaterial}>
                <boxGeometry args={[2.25, 0.06, 0.06]} />
              </mesh>
            </React.Fragment>
          ))}

              {/* Serrure ornée avec gemme centrale - style pirate */}
          <mesh position={[0, 0.05, 0.82]} material={metalMaterial}>
            <boxGeometry args={[0.4, 0.55, 0.12]} />
          </mesh>
          {/* Cadre décoratif autour de la serrure */}
          <mesh position={[0, 0.05, 0.84]} material={metalMaterial}>
            <torusGeometry args={[0.28, 0.04, 8, 16]} />
          </mesh>
          {/* Deuxième cadre pour plus de détail */}
          <mesh position={[0, 0.05, 0.845]} material={metalMaterial}>
            <torusGeometry args={[0.22, 0.02, 8, 16]} />
          </mesh>
          {/* Gemme centrale brillante (plus grosse) */}
          <mesh position={[0, 0.05, 0.9]} material={gemMaterial}>
            <dodecahedronGeometry args={[0.2, 0]} />
          </mesh>
          {/* Petites gemmes décoratives en cercle */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 0.35;
            return (
              <mesh
                key={`small-gem-${i}`}
                position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0.86]}
                material={gemMaterial}
              >
                <octahedronGeometry args={[0.04, 0]} />
              </mesh>
            );
          })}
          {/* Symbole de trésor - croix dorée */}
          <mesh position={[0, -0.3, 0.83]} material={metalMaterial}>
            <boxGeometry args={[0.15, 0.05, 0.05]} />
          </mesh>
          <mesh position={[0, -0.3, 0.83]} material={metalMaterial}>
            <boxGeometry args={[0.05, 0.15, 0.05]} />
          </mesh>
        </mesh>
      </group>

      {/* Pieds du coffre ornés */}
      {[
        [-1, -0.65, 0.75],
        [1, -0.65, 0.75],
        [-1, -0.65, -0.75],
        [1, -0.65, -0.75],
      ].map((pos, i) => (
        <group key={`foot-${i}`} position={pos as [number, number, number]}>
          <mesh material={metalMaterial}>
            <cylinderGeometry args={[0.08, 0.12, 0.15, 8]} />
          </mesh>
          <mesh position={[0, 0.08, 0]} material={metalMaterial}>
            <sphereGeometry args={[0.1, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* Charnières détaillées */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <group key={`hinge-${i}`} position={[x, 0.65, -0.81]}>
          <mesh material={ironMaterial} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 8]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={ironMaterial}>
            <boxGeometry args={[0.12, 0.2, 0.08]} />
          </mesh>
        </group>
      ))}

      {/* Rivets décoratifs dorés sur la base */}
      {[
        [-0.9, 0.5, 0.78], [0, 0.5, 0.78], [0.9, 0.5, 0.78],
        [-0.9, 0, 0.78], [0.9, 0, 0.78],
        [-0.9, -0.5, 0.78], [0, -0.5, 0.78], [0.9, -0.5, 0.78],
      ].map((pos, i) => (
        <mesh key={`rivet-front-${i}`} position={pos as [number, number, number]} material={metalMaterial}>
          <sphereGeometry args={[0.04, 8, 8]} />
        </mesh>
      ))}

      {/* Rivets sur l'arrière */}
      {[
        [-0.9, 0.5, -0.78], [0, 0.5, -0.78], [0.9, 0.5, -0.78],
        [-0.9, 0, -0.78], [0.9, 0, -0.78],
        [-0.9, -0.5, -0.78], [0, -0.5, -0.78], [0.9, -0.5, -0.78],
      ].map((pos, i) => (
        <mesh key={`rivet-back-${i}`} position={pos as [number, number, number]} material={metalMaterial}>
          <sphereGeometry args={[0.04, 8, 8]} />
        </mesh>
      ))}

      {/* Anneaux de transport sur les côtés */}
      {[[-1.15, 0.2, 0], [1.15, 0.2, 0]].map((pos, i) => (
        <group key={`ring-${i}`} position={pos as [number, number, number]}>
          <mesh material={metalMaterial} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.15, 0.04, 8, 16]} />
          </mesh>
          {/* Support de l'anneau */}
          <mesh position={[0, 0.15, 0]} material={metalMaterial}>
            <boxGeometry args={[0.08, 0.15, 0.08]} />
          </mesh>
        </group>
      ))}

      {/* Coins renforcés avec détails */}
      {[
        [-1.05, 0.6, 0.76], [1.05, 0.6, 0.76], [-1.05, 0.6, -0.76], [1.05, 0.6, -0.76],
        [-1.05, -0.6, 0.76], [1.05, -0.6, 0.76], [-1.05, -0.6, -0.76], [1.05, -0.6, -0.76],
      ].map((pos, i) => (
        <mesh key={`corner-detail-${i}`} position={pos as [number, number, number]} material={metalMaterial}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

// Composant pour l'environnement de plage
function BeachEnvironment({ animationPhase }: { animationPhase: string }) {
  const wavesRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (wavesRef.current) {
      // Animation des vagues
      wavesRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group>
      {/* Sable de plage */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40, 32, 32]} />
        <meshStandardMaterial
          color="#F4E4C1"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Eau de mer avec vagues */}
      <mesh
        ref={wavesRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.98, 15]}
        receiveShadow
      >
        <planeGeometry args={[40, 20, 32, 16]} />
        <meshStandardMaterial
          color="#1E88E5"
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Vagues écume */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 5]}>
        <planeGeometry args={[40, 3]} />
        <meshStandardMaterial
          color="#E3F2FD"
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Palmiers */}
      {[[-8, -1, -3], [8, -1, -2], [-6, -1, 2]].map((pos, i) => (
        <group key={`palm-${i}`} position={pos as [number, number, number]}>
          {/* Tronc */}
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 4, 8]} />
            <meshStandardMaterial color="#8B6F47" roughness={0.9} />
          </mesh>
          {/* Feuilles */}
          {Array.from({ length: 8 }).map((_, j) => {
            const angle = (j / 8) * Math.PI * 2;
            return (
              <mesh
                key={`leaf-${j}`}
                position={[Math.cos(angle) * 0.3, 4, Math.sin(angle) * 0.3]}
                rotation={[Math.PI / 6, angle, 0]}
              >
                <boxGeometry args={[0.1, 2, 0.6]} />
                <meshStandardMaterial color="#2E7D32" roughness={0.7} />
              </mesh>
            );
          })}
          {/* Noix de coco */}
          {[0, 1, 2].map((j) => {
            const angle = (j / 3) * Math.PI * 2;
            return (
              <mesh
                key={`coconut-${j}`}
                position={[Math.cos(angle) * 0.3, 3.8, Math.sin(angle) * 0.3]}
              >
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial color="#6D4C41" roughness={0.8} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Rochers sur la plage */}
      {[
        [-4, -0.7, 1], [5, -0.8, -1], [-3, -0.75, -2], [6, -0.85, 3]
      ].map((pos, i) => (
        <mesh key={`rock-${i}`} position={pos as [number, number, number]} castShadow>
          <dodecahedronGeometry args={[0.5 + Math.random() * 0.3, 0]} />
          <meshStandardMaterial color="#78909C" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* Coquillages éparpillés */}
      {Array.from({ length: 15 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 10;
        return (
          <mesh
            key={`shell-${i}`}
            position={[x, -0.95, z]}
            rotation={[0, Math.random() * Math.PI * 2, 0]}
          >
            <coneGeometry args={[0.1, 0.15, 6]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? "#FFF3E0" : i % 3 === 1 ? "#FFE0B2" : "#FFCCBC"}
              roughness={0.6}
            />
          </mesh>
        );
      })}

      {/* Étoiles de mer */}
      {[[-2, -0.95, 0.5], [3, -0.95, -0.8], [-1, -0.95, 2]].map((pos, i) => (
        <mesh
          key={`starfish-${i}`}
          position={pos as [number, number, number]}
          rotation={[-Math.PI / 2, 0, (i * Math.PI) / 3]}
        >
          <cylinderGeometry args={[0.25, 0.25, 0.05, 5]} />
          <meshStandardMaterial color="#FF6F61" roughness={0.8} />
        </mesh>
      ))}

      {/* Planches de bois échouées */}
      {[[-5, -0.9, 0], [4, -0.9, 1]].map((pos, i) => (
        <mesh
          key={`plank-${i}`}
          position={pos as [number, number, number]}
          rotation={[0, i * 0.5, 0]}
        >
          <boxGeometry args={[2, 0.1, 0.3]} />
          <meshStandardMaterial color="#8D6E63" roughness={0.9} />
        </mesh>
      ))}

      {/* Soleil (lumière) */}
      <mesh position={[-10, 10, -10]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#FFF9C4" />
      </mesh>
    </group>
  );
}

// Composant pour une pile de cartes avec image réelle
function CardStack({
  cards,
  onCardReveal
}: {
  cards: CardType[];
  onCardReveal: (index: number) => void;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const stackRef = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);

  useFrame((state) => {
    if (!stackRef.current) return;

    // Animation d'entrée de la pile
    if (revealedCount === 0) {
      const targetY = 2;
      stackRef.current.position.y = THREE.MathUtils.lerp(
        stackRef.current.position.y,
        targetY,
        0.05
      );
    }

    // Légère rotation de la pile
    stackRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
  });

  const handleStackClick = () => {
    if (animating || revealedCount >= cards.length) return;

    setAnimating(true);
    onCardReveal(revealedCount);

    setTimeout(() => {
      setRevealedCount(prev => prev + 1);
      setAnimating(false);
    }, 600);
  };

  const remainingCards = cards.length - revealedCount;

  return (
    <group ref={stackRef} position={[0, -2, 0]} onClick={handleStackClick}>
      {remainingCards > 0 && (
        <>
          {/* Afficher les cartes restantes empilées */}
          {Array.from({ length: Math.min(remainingCards, 5) }).map((_, i) => {
            const cardIndex = revealedCount + i;
            const card = cards[cardIndex];
            if (!card) return null;

            const offset = i * 0.05;
            const rarityColor = {
              common: '#9CA3AF',
              uncommon: '#10B981',
              rare: '#3B82F6',
              super_rare: '#A855F7',
              secret_rare: '#FBBF24',
            }[card.rarity] || '#9CA3AF';

            return (
              <group key={`card-${cardIndex}`} position={[0, offset, -offset * 0.5]}>
                {/* Carte avec bordure brillante selon la rareté */}
                <mesh castShadow>
                  <boxGeometry args={[1.2, 1.7, 0.02]} />
                  <meshStandardMaterial
                    color="#1F2937"
                    roughness={0.3}
                    metalness={0.6}
                  />
                </mesh>

                {/* Bordure de rareté */}
                <mesh position={[0, 0, 0.02]}>
                  <boxGeometry args={[1.15, 1.65, 0.01]} />
                  <meshStandardMaterial
                    color={rarityColor}
                    emissive={rarityColor}
                    emissiveIntensity={i === 0 ? 0.5 : 0.2}
                    roughness={0.2}
                    metalness={0.8}
                  />
                </mesh>

                {/* Face de la carte (dos) */}
                <mesh position={[0, 0, 0.03]}>
                  <boxGeometry args={[1.1, 1.6, 0.01]} />
                  <meshStandardMaterial
                    color="#374151"
                    roughness={0.4}
                    metalness={0.3}
                  />
                </mesh>

                {/* Pattern du dos */}
                {i === 0 && (
                  <>
                    <mesh position={[0, 0, 0.04]}>
                      <torusGeometry args={[0.3, 0.05, 8, 16]} />
                      <meshStandardMaterial
                        color={rarityColor}
                        emissive={rarityColor}
                        emissiveIntensity={0.6}
                      />
                    </mesh>
                    <mesh position={[0, 0, 0.04]}>
                      <sphereGeometry args={[0.15, 8, 8]} />
                      <meshStandardMaterial
                        color={rarityColor}
                        emissive={rarityColor}
                        emissiveIntensity={0.8}
                      />
                    </mesh>
                  </>
                )}
              </group>
            );
          })}

          {/* Lumière au-dessus de la pile */}
          <pointLight
            position={[0, 1, 0.5]}
            color="#FFD700"
            intensity={2}
            distance={3}
          />
        </>
      )}

      {remainingCards === 0 && (
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

// Composant pour la carte en train d'être révélée (avec animation de flip)
function RevealingCard({
  card,
  position
}: {
  card: CardType;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  useFrame(() => {
    if (!meshRef.current) return;

    setProgress(prev => Math.min(prev + 0.02, 1));

    // Animation de flip
    meshRef.current.rotation.y = progress * Math.PI;

    // Monte pendant le flip
    meshRef.current.position.y = position[1] + Math.sin(progress * Math.PI) * 1.5;
    meshRef.current.position.x = THREE.MathUtils.lerp(-2, position[0], progress);
    meshRef.current.position.z = position[2];

    // Scale pulse
    const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
    meshRef.current.scale.set(scale, scale, 1);
  });

  const rarityColor = {
    common: '#9CA3AF',
    uncommon: '#10B981',
    rare: '#3B82F6',
    super_rare: '#A855F7',
    secret_rare: '#FBBF24',
  }[card.rarity] || '#9CA3AF';

  return (
    <group ref={meshRef} position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.2, 1.7, 0.02]} />
        <meshStandardMaterial
          color={rarityColor}
          emissive={rarityColor}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      <pointLight
        position={[0, 0, 0.5]}
        color={rarityColor}
        intensity={3}
        distance={2}
      />
    </group>
  );
}

// Composant principal de la scène 3D
function Scene({
  isOpening,
  cards,
  animationPhase,
  onClick,
  onCardReveal
}: {
  isOpening: boolean;
  cards?: CardType[];
  animationPhase: string;
  onClick?: () => void;
  onCardReveal?: (index: number) => void;
}) {
  const [revealedCards, setRevealedCards] = useState<CardType[]>([]);

  const handleCardReveal = (index: number) => {
    if (cards && cards[index]) {
      setRevealedCards(prev => [...prev, cards[index]]);
      onCardReveal?.(index);
    }
  };

  return (
    <>
      {/* Caméra */}
      <PerspectiveCamera
        makeDefault
        position={animationPhase === 'deck' ? [0, 5, 6] : [0, 4, 7]}
        fov={55}
      />

      {/* Contrôles */}
      <OrbitControls
        enabled={animationPhase === 'idle'}
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.2}
      />

      {/* Lumières de la scène - ambiance plage ensoleillée */}
      <ambientLight intensity={0.7} color="#FFF9E6" />

      {/* Soleil (lumière directionnelle) */}
      <directionalLight
        position={[-10, 15, -5]}
        intensity={1.5}
        color="#FFFACD"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Lumière de remplissage douce */}
      <pointLight position={[8, 5, 8]} intensity={0.4} color="#B3E5FC" />
      <pointLight position={[-8, 5, -8]} intensity={0.3} color="#FFE082" />

      {/* Lumière réfléchie de l'eau */}
      <pointLight position={[0, 2, 10]} intensity={0.5} color="#4FC3F7" />

      {/* Environnement de plage */}
      <BeachEnvironment animationPhase={animationPhase} />

      {/* Particules magiques */}
      <MagicParticles isActive={isOpening || animationPhase === 'deck'} />

      {/* Coffre au trésor */}
      {(animationPhase === 'idle' || animationPhase === 'opening' || animationPhase === 'deck') && (
        <Chest isOpening={isOpening} onClick={onClick} animationPhase={animationPhase} />
      )}

      {/* Pile de cartes (phase de découverte) */}
      {animationPhase === 'deck' && cards && (
        <CardStack cards={cards} onCardReveal={handleCardReveal} />
      )}

      {/* Cartes révélées affichées sur le côté */}
      {revealedCards.map((card, i) => (
        <RevealingCard
          key={`revealed-${card.id}-${i}`}
          card={card}
          position={[4 + (i % 2) * 0.5, 2 + i * 0.3, -i * 0.2]}
        />
      ))}

      {/* Ciel avec dégradé */}
      <mesh position={[0, 20, -30]} scale={[60, 40, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>

      {/* Brouillard léger pour la profondeur */}
      <fog attach="fog" args={['#B3E5FC', 15, 35]} />
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
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealedCardsData, setRevealedCardsData] = useState<CardType[]>([]);

  const handleCardReveal = (index: number) => {
    if (cards && cards[index]) {
      setRevealedCount(index + 1);
      setRevealedCardsData(prev => [...prev, cards[index]]);

      if (index === cards.length - 1) {
        // Toutes les cartes ont été révélées
        setTimeout(() => {
          onAnimationComplete?.();
        }, 1500);
      }
    }
  };

  // Fonction pour obtenir la couleur de rareté
  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'from-gray-600 to-gray-800',
      uncommon: 'from-green-600 to-green-800',
      rare: 'from-blue-600 to-blue-800',
      super_rare: 'from-purple-600 to-purple-800',
      secret_rare: 'from-yellow-500 to-yellow-700',
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="w-full h-[600px] relative">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        className="bg-gradient-to-b from-sky-300 via-sky-400 to-blue-300 rounded-2xl"
      >
        <Scene
          isOpening={isOpening}
          cards={cards}
          animationPhase={animationPhase}
          onClick={onClick}
          onCardReveal={handleCardReveal}
        />
      </Canvas>

      {/* Instructions */}
      {animationPhase === 'idle' && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/80 text-sm backdrop-blur-sm bg-black/30 py-2 px-4 rounded-lg inline-block">
            🖱️ Cliquez sur le coffre pour l'ouvrir • Utilisez la souris pour pivoter la vue
          </p>
        </div>
      )}

      {animationPhase === 'deck' && cards && (
        <>
          <div className="absolute top-4 left-0 right-0 text-center z-10">
            <div className="backdrop-blur-sm bg-black/40 py-3 px-6 rounded-lg inline-block">
              <p className="text-white font-semibold text-lg mb-1">
                🎴 Cliquez sur la pile pour découvrir vos cartes !
              </p>
              <p className="text-blue-300 text-sm">
                {revealedCount} / {cards.length} cartes révélées
              </p>
            </div>
          </div>

          {/* Affichage des cartes révélées en 2D sur le côté droit */}
          <div className="absolute right-4 top-20 bottom-4 w-48 overflow-y-auto space-y-3">
            {revealedCardsData.map((card, i) => (
              <div
                key={`revealed-2d-${card.id}-${i}`}
                className={`bg-gradient-to-br ${getRarityColor(card.rarity)} rounded-lg p-2 shadow-2xl transform transition-all duration-500 hover:scale-105`}
                style={{
                  animation: `slideInRight 0.5s ease-out ${i * 0.1}s both`,
                }}
              >
                <div className="bg-gray-900 rounded-md overflow-hidden">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x420?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-800">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-white text-xs font-semibold truncate">{card.name}</p>
                  <p className="text-white/70 text-xs">{card.cost} 💎</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {animationPhase === 'opening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="backdrop-blur-sm bg-black/40 py-4 px-8 rounded-xl">
            <p className="text-white font-bold text-2xl animate-pulse">
              ✨ Ouverture du coffre... ✨
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ChestAnimation3D;
