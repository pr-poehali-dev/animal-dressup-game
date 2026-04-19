import React, { useState, useEffect, useCallback } from "react";
import {
  getPlayerAnimals,
  getPlayerPatterns,
  createCostume,
  CLOTH_TYPES,
  MATERIALS,
  COLORS,
  ALL_ANIMALS,
  ALL_PATTERNS,
  type Player,
  type Costume,
} from "@/lib/gameStore";
import CostumePreview from "@/components/CostumePreview";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkshopProps {
  player: Player;
  onCoinsUpdate: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  "Животное",
  "Одежда",
  "Узор и цвет",
  "Название",
];

const STEP_ICONS = ["Paw", "Shirt", "Palette", "Sparkles"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultState() {
  return {
    animalId: "",
    animalEmoji: "",
    animalName: "",
    clothType: CLOTH_TYPES[0],
    material: MATERIALS[0],
    patternId: "",
    patternName: "",
    patternCss: "",
    primaryColor: COLORS[0],
    secondaryColor: COLORS[4],
    costumeName: "",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StepDotsProps {
  current: number;
}

const StepDots: React.FC<StepDotsProps> = ({ current }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={i}>
          <div
            className={[
              "relative flex items-center justify-center rounded-full font-bold text-xs transition-all duration-300",
              active
                ? "w-10 h-10 bg-workshop text-white shadow-lg scale-110"
                : done
                ? "w-8 h-8 bg-workshop/40 text-workshop"
                : "w-8 h-8 bg-white/60 text-gray-400 border-2 border-gray-200",
            ].join(" ")}
          >
            {done ? (
              <Icon name="Check" size={14} />
            ) : (
              <span>{i + 1}</span>
            )}
            {active && (
              <span className="absolute -bottom-5 text-[10px] font-bold text-workshop whitespace-nowrap">
                {STEP_LABELS[i]}
              </span>
            )}
          </div>
          {i < TOTAL_STEPS - 1 && (
            <div
              className={[
                "h-1 w-6 rounded-full transition-all duration-300",
                done ? "bg-workshop/50" : "bg-gray-200",
              ].join(" ")}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

interface ColorSwatchProps {
  color: string;
  selected: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={["color-swatch border-4", selected ? "selected border-gray-800 scale-110" : "border-white"].join(" ")}
    style={{ backgroundColor: color, color }}
    title={color}
    aria-label={`Цвет ${color}`}
  />
);

interface CoinPopupProps {
  visible: boolean;
}

const CoinPopup: React.FC<CoinPopupProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-coin-pop text-4xl font-pacifico text-yellow-500 drop-shadow-lg select-none">
        +10 🪙
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Workshop: React.FC<WorkshopProps> = ({ player, onCoinsUpdate }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(buildDefaultState());
  const [animatedAnimalId, setAnimatedAnimalId] = useState<string | null>(null);
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [savedKey, setSavedKey] = useState(0); // bump to reset animation

  // Owned items
  const ownedAnimals = getPlayerAnimals(player.id).filter((a) => a.owned);
  const ownedPatterns = getPlayerPatterns(player.id).filter((p) => p.owned);

  // Initialise default pattern when patterns are available
  useEffect(() => {
    if (!form.patternId && ownedPatterns.length > 0) {
      const first = ownedPatterns[0];
      setForm((f) => ({
        ...f,
        patternId: first.id,
        patternName: first.name,
        patternCss: first.cssClass,
      }));
    }
  }, [savedKey]); // re-run after reset

  // ── Derived preview props ──────────────────────────────────────────────────

  const previewAnimalEmoji = form.animalEmoji || "🐾";
  const previewClothType = form.clothType;
  const previewPatternCss = form.patternCss || "pattern-solid";

  // ── Handlers ──────────────────────────────────────────────────────────────

  const selectAnimal = useCallback(
    (id: string, emoji: string, name: string) => {
      setForm((f) => ({ ...f, animalId: id, animalEmoji: emoji, animalName: name }));
      setAnimatedAnimalId(id);
      setTimeout(() => setAnimatedAnimalId(null), 600);
    },
    [],
  );

  const selectPattern = useCallback(
    (id: string, name: string, cssClass: string) => {
      setForm((f) => ({ ...f, patternId: id, patternName: name, patternCss: cssClass }));
    },
    [],
  );

  const canAdvance = (): boolean => {
    if (step === 0) return !!form.animalId;
    if (step === 1) return !!form.clothType && !!form.material;
    if (step === 2) return !!form.patternId && !!form.primaryColor && !!form.secondaryColor;
    if (step === 3) return form.costumeName.trim().length > 0;
    return false;
  };

  const handleSave = () => {
    if (!canAdvance()) return;

    const costumeData: Omit<Costume, "id" | "createdAt" | "playerId" | "playerName"> = {
      animalId: form.animalId,
      animalEmoji: form.animalEmoji,
      animalName: form.animalName,
      name: form.costumeName.trim(),
      clothType: form.clothType,
      material: form.material,
      patternId: form.patternId,
      patternName: form.patternName,
      patternCss: form.patternCss,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
    };

    createCostume(player.id, costumeData);

    // Coin popup
    setShowCoinPopup(true);
    setTimeout(() => setShowCoinPopup(false), 1000);

    // Reset
    const nextKey = savedKey + 1;
    setSavedKey(nextKey);
    setForm(buildDefaultState());
    setStep(0);
    onCoinsUpdate();
  };

  // ── Step panels ────────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="animate-fade-in">
      <h2 className="font-pacifico text-xl text-workshop mb-4 text-center">
        Выбери животное
      </h2>
      {ownedAnimals.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          У тебя пока нет животных. Загляни в магазин! 🛍️
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ownedAnimals.map((animal) => {
            const isSelected = form.animalId === animal.id;
            return (
              <button
                key={animal.id}
                type="button"
                onClick={() => selectAnimal(animal.id, animal.emoji, animal.name)}
                className={[
                  "card-bubble p-3 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200",
                  isSelected
                    ? "border-4 border-workshop shadow-xl scale-105"
                    : "hover:-translate-y-1 hover:scale-103",
                  animatedAnimalId === animal.id ? "animate-bounce-in" : "",
                ].join(" ")}
              >
                <span className="text-5xl leading-none">{animal.emoji}</span>
                <span
                  className={[
                    "text-xs font-bold mt-1 text-center",
                    isSelected ? "text-workshop" : "text-foreground/70",
                  ].join(" ")}
                >
                  {animal.name}
                </span>
                {isSelected && (
                  <span className="absolute top-2 right-2 text-workshop">
                    <Icon name="CheckCircle2" size={16} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {/* Locked animals hint */}
      {ALL_ANIMALS.length > ownedAnimals.length && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          🔒 Ещё {ALL_ANIMALS.length - ownedAnimals.length} животных доступно в магазине
        </p>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="animate-fade-in space-y-6">
      {/* Cloth type */}
      <div>
        <h2 className="font-pacifico text-xl text-workshop mb-3 text-center">
          Тип одежды
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CLOTH_TYPES.map((cloth) => (
            <button
              key={cloth}
              type="button"
              onClick={() => setForm((f) => ({ ...f, clothType: cloth }))}
              className={[
                "card-bubble py-2 px-3 text-sm font-bold transition-all duration-150 text-center",
                form.clothType === cloth
                  ? "border-4 border-workshop text-workshop scale-105 shadow-lg"
                  : "border-2 border-transparent text-foreground/70 hover:border-workshop/40 hover:-translate-y-0.5",
              ].join(" ")}
            >
              {cloth}
            </button>
          ))}
        </div>
      </div>

      {/* Material */}
      <div>
        <h2 className="font-pacifico text-xl text-workshop mb-3 text-center">
          Материал
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MATERIALS.map((mat) => (
            <button
              key={mat}
              type="button"
              onClick={() => setForm((f) => ({ ...f, material: mat }))}
              className={[
                "card-bubble py-2 px-3 text-sm font-bold transition-all duration-150 text-center",
                form.material === mat
                  ? "border-4 border-workshop text-workshop scale-105 shadow-lg"
                  : "border-2 border-transparent text-foreground/70 hover:border-workshop/40 hover:-translate-y-0.5",
              ].join(" ")}
            >
              {mat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fade-in space-y-6">
      {/* Pattern */}
      <div>
        <h2 className="font-pacifico text-xl text-workshop mb-3 text-center">
          Узор
        </h2>
        {ownedPatterns.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Узоры не найдены. Загляни в магазин! 🛍️
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ownedPatterns.map((pat) => (
              <button
                key={pat.id}
                type="button"
                onClick={() => selectPattern(pat.id, pat.name, pat.cssClass)}
                className={[
                  "card-bubble overflow-hidden transition-all duration-150",
                  form.patternId === pat.id
                    ? "border-4 border-workshop scale-105 shadow-lg"
                    : "border-2 border-transparent hover:border-workshop/40 hover:-translate-y-0.5",
                ].join(" ")}
              >
                {/* Pattern swatch */}
                <div
                  className={`h-10 w-full ${pat.cssClass}`}
                  style={{
                    ["--p-color1" as string]: form.primaryColor,
                    ["--p-color2" as string]: form.secondaryColor,
                  }}
                />
                <div
                  className={[
                    "py-1 px-2 text-xs font-bold text-center",
                    form.patternId === pat.id ? "text-workshop" : "text-foreground/70",
                  ].join(" ")}
                >
                  {pat.name}
                </div>
              </button>
            ))}
          </div>
        )}
        {ALL_PATTERNS.length > ownedPatterns.length && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            🔒 Ещё {ALL_PATTERNS.length - ownedPatterns.length} узоров в магазине
          </p>
        )}
      </div>

      {/* Primary color */}
      <div>
        <h2 className="font-pacifico text-lg text-workshop mb-3 text-center">
          Основной цвет
        </h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {COLORS.map((color) => (
            <ColorSwatch
              key={`primary-${color}`}
              color={color}
              selected={form.primaryColor === color}
              onClick={() => setForm((f) => ({ ...f, primaryColor: color }))}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div
            className="w-6 h-6 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: form.primaryColor }}
          />
          <span className="text-xs text-muted-foreground font-mono">{form.primaryColor}</span>
        </div>
      </div>

      {/* Secondary color */}
      <div>
        <h2 className="font-pacifico text-lg text-workshop mb-3 text-center">
          Дополнительный цвет
        </h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {COLORS.map((color) => (
            <ColorSwatch
              key={`secondary-${color}`}
              color={color}
              selected={form.secondaryColor === color}
              onClick={() => setForm((f) => ({ ...f, secondaryColor: color }))}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div
            className="w-6 h-6 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: form.secondaryColor }}
          />
          <span className="text-xs text-muted-foreground font-mono">{form.secondaryColor}</span>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-pacifico text-xl text-workshop mb-3 text-center">
          Придумай название
        </h2>
        <div className="relative">
          <input
            type="text"
            maxLength={40}
            value={form.costumeName}
            onChange={(e) => setForm((f) => ({ ...f, costumeName: e.target.value }))}
            placeholder="Например: Королевский бархат 👑"
            className={[
              "w-full rounded-2xl border-4 px-4 py-3 text-base font-bold",
              "bg-white placeholder:text-gray-300 outline-none transition-all duration-200",
              form.costumeName.trim()
                ? "border-workshop text-foreground"
                : "border-gray-200 text-foreground focus:border-workshop/60",
            ].join(" ")}
          />
          {form.costumeName && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, costumeName: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {form.costumeName.length}/40
        </p>
      </div>

      {/* Full summary */}
      <div className="card-bubble p-4 space-y-2">
        <h3 className="font-pacifico text-workshop text-sm mb-2">Итог костюма:</h3>
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">Животное:</span>
          <span className="font-bold">
            {form.animalEmoji} {form.animalName || "—"}
          </span>
          <span className="text-muted-foreground">Одежда:</span>
          <span className="font-bold">{form.clothType}</span>
          <span className="text-muted-foreground">Материал:</span>
          <span className="font-bold">{form.material}</span>
          <span className="text-muted-foreground">Узор:</span>
          <span className="font-bold">{form.patternName || "—"}</span>
          <span className="text-muted-foreground">Цвета:</span>
          <span className="font-bold flex items-center gap-1">
            <span
              className="inline-block w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: form.primaryColor }}
            />
            <span
              className="inline-block w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: form.secondaryColor }}
            />
          </span>
        </div>
      </div>
    </div>
  );

  const STEP_RENDERERS = [renderStep0, renderStep1, renderStep2, renderStep3];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-24">
      <CoinPopup visible={showCoinPopup} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* ── Title ── */}
        <h1 className="font-pacifico text-4xl text-center text-workshop drop-shadow mb-2">
          🧵 Мастерская
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Создай уникальный наряд для своего питомца!
        </p>

        {/* ── Live preview ── */}
        <div className="card-bubble p-5 mb-8 flex flex-col items-center gap-3 bg-gradient-to-b from-workshop/10 to-white">
          <p className="text-xs font-bold text-workshop/70 uppercase tracking-widest">
            Предпросмотр
          </p>
          <CostumePreview
            animalEmoji={previewAnimalEmoji}
            primaryColor={form.primaryColor}
            secondaryColor={form.secondaryColor}
            patternCss={previewPatternCss}
            clothType={previewClothType}
            size="lg"
            animate
          />
          {form.costumeName && (
            <p className="font-pacifico text-lg text-workshop text-center">
              {form.costumeName}
            </p>
          )}
          {!form.animalId && (
            <p className="text-xs text-muted-foreground">
              Выбери животное, чтобы увидеть наряд
            </p>
          )}
        </div>

        {/* ── Step dots ── */}
        <div className="mb-10">
          <StepDots current={step} />
        </div>

        {/* ── Step content ── */}
        <div className="card-bubble p-5 mb-6 relative">
          {STEP_RENDERERS[step]()}
        </div>

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between gap-3">
          {/* Prev */}
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-cartoon flex items-center gap-2"
              style={{ background: "hsl(270 30% 70%)" }}
            >
              <Icon name="ChevronLeft" size={18} />
              Назад
            </button>
          ) : (
            <div />
          )}

          {/* Next / Save */}
          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (canAdvance()) setStep((s) => s + 1);
              }}
              disabled={!canAdvance()}
              className={[
                "btn-cartoon flex items-center gap-2 ml-auto transition-opacity",
                !canAdvance() ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
              style={{ background: canAdvance() ? "hsl(270 80% 65%)" : undefined }}
            >
              Далее
              <Icon name="ChevronRight" size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={!canAdvance()}
              className={[
                "btn-cartoon flex items-center gap-2 ml-auto gap-2",
                !canAdvance() ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
              style={{
                background: canAdvance()
                  ? "linear-gradient(135deg, hsl(330 90% 60%), hsl(270 80% 65%))"
                  : undefined,
              }}
            >
              <Icon name="Sparkles" size={18} />
              Сохранить костюм
              <span className="badge-coin ml-1 text-xs">+10 🪙</span>
            </button>
          )}
        </div>

        {/* Step hint */}
        {step === 0 && !form.animalId && (
          <p className="mt-3 text-center text-xs text-workshop/70 animate-fade-in">
            Нажми на карточку животного, чтобы выбрать его
          </p>
        )}
      </div>
    </div>
  );
};

export default Workshop;
