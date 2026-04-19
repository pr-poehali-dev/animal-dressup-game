import React, { useState, useEffect } from "react";
import {
  ALL_ANIMALS,
  getPlayerAnimals,
  getGlobalCostumes,
  type Player,
  type Animal,
  type Costume,
} from "@/lib/gameStore";
import CostumePreview from "@/components/CostumePreview";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ZooProps {
  player: Player | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AnimalCostumesDrawerProps {
  animal: Animal;
  costumes: Costume[];
  onClose: () => void;
}

const AnimalCostumesDrawer: React.FC<AnimalCostumesDrawerProps> = ({
  animal,
  costumes,
  onClose,
}) => (
  <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={onClose}>
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

    {/* Sheet */}
    <div
      className="relative z-50 w-full max-w-2xl bg-white rounded-t-4xl px-5 pt-5 pb-28 max-h-[80vh] overflow-y-auto animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle */}
      <div className="w-10 h-1.5 rounded-full bg-gray-200 mx-auto mb-4" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-5xl leading-none">{animal.emoji}</span>
        <div>
          <h2 className="font-pacifico text-2xl text-zoo">{animal.name}</h2>
          <p className="text-sm text-muted-foreground">{animal.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Icon name="X" size={18} />
        </button>
      </div>

      {/* Stats line */}
      <div className="flex items-center gap-2 mb-4">
        <span className="badge-coin text-xs">
          🎨 {costumes.length} {costumes.length === 1 ? "наряд" : costumes.length < 5 ? "наряда" : "нарядов"}
        </span>
      </div>

      {/* Costume grid */}
      {costumes.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-2">🪡</div>
          <p className="font-bold text-foreground">Нарядов пока нет</p>
          <p className="text-sm text-muted-foreground mt-1">
            Создай первый наряд для {animal.name} в Мастерской!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {costumes.map((costume) => (
            <div key={costume.id} className="card-bubble p-3 flex flex-col items-center gap-2">
              <CostumePreview
                animalEmoji={costume.animalEmoji}
                primaryColor={costume.primaryColor}
                secondaryColor={costume.secondaryColor}
                patternCss={costume.patternCss}
                clothType={costume.clothType}
                size="sm"
              />
              <div className="text-center">
                <p className="text-xs font-bold text-foreground leading-tight line-clamp-2">
                  {costume.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {costume.clothType} · {costume.material}
                </p>
                <p className="text-[10px] text-zoo font-bold mt-0.5">
                  {costume.playerName} · {formatDate(costume.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── Animal card ─────────────────────────────────────────────────────────────

interface AnimalCardProps {
  animal: Animal;
  owned: boolean;
  costumeCount: number;
  onClick: () => void;
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal, owned, costumeCount, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="animal-card flex flex-col items-center gap-2 text-center group relative"
  >
    {/* Owned badge */}
    {owned && (
      <span className="absolute top-2 right-2 bg-zoo text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
        <Icon name="CheckCircle2" size={10} />
        Есть
      </span>
    )}

    {/* Emoji */}
    <div
      className={[
        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-200 group-hover:scale-110",
        owned ? "bg-zoo/15" : "bg-muted",
      ].join(" ")}
      style={{ fontSize: "3.5rem" }}
    >
      {animal.emoji}
    </div>

    {/* Name */}
    <div className="font-pacifico text-sm text-foreground leading-tight">{animal.name}</div>

    {/* Description */}
    <div className="text-[11px] text-muted-foreground leading-tight">{animal.description}</div>

    {/* Bottom row: price + costume count */}
    <div className="flex items-center justify-between w-full mt-1 gap-1 flex-wrap">
      {animal.price === 0 ? (
        <span className="text-[10px] font-bold text-zoo">Бесплатно</span>
      ) : (
        <span className="badge-coin text-[10px] py-0 px-1.5">🪙 {animal.price}</span>
      )}
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
        <Icon name="Shirt" size={10} />
        {costumeCount}
      </span>
    </div>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Zoo: React.FC<ZooProps> = ({ player }) => {
  const [allCostumes, setAllCostumes] = useState<Costume[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    setAllCostumes(getGlobalCostumes());
  }, []);

  // Build owned set for player
  const ownedIds = new Set<string>(
    player ? getPlayerAnimals(player.id).filter((a) => a.owned).map((a) => a.id) : [],
  );

  // Global stats
  const totalCostumes = allCostumes.length;
  const mostDressed = ALL_ANIMALS.reduce<{ animal: Animal; count: number } | null>((acc, a) => {
    const count = allCostumes.filter((c) => c.animalId === a.id).length;
    if (!acc || count > acc.count) return { animal: a, count };
    return acc;
  }, null);

  const animalsForDrawer =
    selectedAnimal ? allCostumes.filter((c) => c.animalId === selectedAnimal.id) : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-28">
      {/* Drawer */}
      {selectedAnimal && (
        <AnimalCostumesDrawer
          animal={selectedAnimal}
          costumes={animalsForDrawer}
          onClose={() => setSelectedAnimal(null)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Title */}
        <h1 className="font-pacifico text-4xl text-zoo text-center drop-shadow mb-2">
          🦁 Зоопарк
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Все животные игры — нажми, чтобы увидеть их наряды!
        </p>

        {/* Fun stats banner */}
        <div className="card-bubble p-4 mb-6 grid grid-cols-3 gap-3 bg-gradient-to-r from-zoo/10 to-transparent">
          <div className="flex flex-col items-center gap-1">
            <span className="font-pacifico text-2xl text-zoo">{ALL_ANIMALS.length}</span>
            <span className="text-[11px] text-muted-foreground text-center">видов<br />животных</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-pacifico text-2xl text-gallery">{totalCostumes}</span>
            <span className="text-[11px] text-muted-foreground text-center">всего<br />костюмов</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {mostDressed && mostDressed.count > 0 ? (
              <>
                <span className="text-2xl leading-none">{mostDressed.animal.emoji}</span>
                <span className="text-[11px] text-muted-foreground text-center">
                  топ<br />модник
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl">🏆</span>
                <span className="text-[11px] text-muted-foreground text-center">
                  топ<br />модник
                </span>
              </>
            )}
          </div>
        </div>

        {/* Animal grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-in">
          {ALL_ANIMALS.map((animal) => {
            const count = allCostumes.filter((c) => c.animalId === animal.id).length;
            return (
              <AnimalCard
                key={animal.id}
                animal={animal}
                owned={ownedIds.has(animal.id)}
                costumeCount={count}
                onClick={() => setSelectedAnimal(animal)}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 card-bubble p-4 flex flex-col gap-2">
          <p className="font-bold text-sm text-foreground flex items-center gap-2">
            <Icon name="Info" size={15} className="text-zoo" />
            Как пользоваться зоопарком
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 pl-1">
            <li>• Нажми на карточку животного, чтобы увидеть все наряды для него</li>
            <li>• Значок <strong className="text-zoo">Есть ✓</strong> означает, что животное у тебя в коллекции</li>
            <li>• Число <Icon name="Shirt" size={10} className="inline" /> рядом с ценой — количество созданных нарядов</li>
            <li>• Купить животных можно в 🏪 Магазине</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Zoo;
