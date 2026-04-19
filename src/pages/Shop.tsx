import React, { useState, useEffect } from "react";
import {
  getPlayerAnimals,
  getPlayerPatterns,
  ALL_ANIMALS,
  ALL_PATTERNS,
  buyItem,
  type Player,
} from "@/lib/gameStore";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopProps {
  player: Player;
  onCoinsUpdate: () => void;
}

type Tab = "animals" | "patterns";

interface ToastMsg {
  id: number;
  text: string;
  success: boolean;
}

// ─── Pattern preview swatch ───────────────────────────────────────────────────

interface PatternSwatchProps {
  cssClass: string;
}

const PatternSwatch: React.FC<PatternSwatchProps> = ({ cssClass }) => (
  <div
    className={`w-full rounded-xl ${cssClass}`}
    style={{
      height: 20,
      ["--p-color1" as string]: "#ff6b6b",
      ["--p-color2" as string]: "#ffffff",
    }}
  />
);

// ─── Toast stack ─────────────────────────────────────────────────────────────

interface ToastStackProps {
  messages: ToastMsg[];
}

const ToastStack: React.FC<ToastStackProps> = ({ messages }) => (
  <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
    {messages.map((m) => (
      <div
        key={m.id}
        className={[
          "animate-slide-up px-5 py-2.5 rounded-2xl font-bold text-sm text-white shadow-lg",
          m.success ? "bg-shop" : "bg-destructive",
        ].join(" ")}
      >
        {m.text}
      </div>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Shop: React.FC<ShopProps> = ({ player, onCoinsUpdate }) => {
  const [tab, setTab] = useState<Tab>("animals");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [coins, setCoins] = useState(player.coins);

  // Re-read owned state on each render so it stays in sync after purchases
  const playerAnimals = getPlayerAnimals(player.id);
  const playerPatterns = getPlayerPatterns(player.id);

  useEffect(() => {
    setCoins(player.coins);
  }, [player.coins]);

  // ── Toast helper ──────────────────────────────────────────────────────────

  const showToast = (text: string, success: boolean) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, success }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2200);
  };

  // ── Buy handler ───────────────────────────────────────────────────────────

  const handleBuy = (type: "animal" | "pattern", id: string, price: number, name: string) => {
    const result = buyItem(player.id, type, id, price);
    if (result.success) {
      showToast(`${name} куплено! 🎉`, true);
      if (result.newCoins !== undefined) setCoins(result.newCoins);
      onCoinsUpdate();
    } else {
      showToast(result.message, false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-28">
      <ToastStack messages={toasts} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-pacifico text-4xl text-shop drop-shadow">🏪 Магазин</h1>
          <span className="badge-coin text-base px-4 py-2">
            🪙 {coins}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Покупай новых животных и красивые узоры!
        </p>

        {/* Tab switcher */}
        <div className="card-bubble p-1.5 flex gap-1 mb-6">
          {(
            [
              { key: "animals", label: "🐾 Животные", count: ALL_ANIMALS.length },
              { key: "patterns", label: "🎨 Паттерны", count: ALL_PATTERNS.length },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold text-sm transition-all duration-200",
                tab === key
                  ? "bg-shop text-white shadow-md"
                  : "text-muted-foreground hover:bg-shop/10",
              ].join(" ")}
            >
              {label}
              <span
                className={[
                  "text-xs rounded-full px-2 py-0.5",
                  tab === key ? "bg-white/30" : "bg-muted",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Animals tab ─────────────────────────────────────────────────── */}
        {tab === "animals" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-fade-in">
            {ALL_ANIMALS.map((animal) => {
              const owned = playerAnimals.find((a) => a.id === animal.id)?.owned ?? false;
              const canAfford = coins >= animal.price;
              return (
                <div
                  key={animal.id}
                  className={[
                    "card-bubble p-4 flex items-center gap-4 transition-all duration-200",
                    owned ? "border-4 border-shop/40" : "",
                  ].join(" ")}
                >
                  {/* Emoji */}
                  <div
                    className={[
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0",
                      owned ? "bg-shop/10" : "bg-muted",
                    ].join(" ")}
                  >
                    {animal.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-pacifico text-lg text-foreground leading-tight">
                      {animal.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {animal.description}
                    </div>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {animal.price === 0 ? (
                        <span className="text-xs font-bold text-shop">Бесплатно</span>
                      ) : (
                        <span className="badge-coin text-xs py-0.5 px-2">
                          🪙 {animal.price}
                        </span>
                      )}

                      {owned ? (
                        <span className="inline-flex items-center gap-1 bg-shop/15 text-shop text-xs font-bold rounded-full px-3 py-1">
                          <Icon name="CheckCircle2" size={12} />
                          Есть ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleBuy("animal", animal.id, animal.price, animal.name)}
                          className={[
                            "btn-cartoon text-xs px-4 py-1.5",
                            !canAfford ? "opacity-40 cursor-not-allowed" : "",
                          ].join(" ")}
                          style={{ background: canAfford ? "hsl(160 70% 45%)" : undefined }}
                        >
                          {canAfford ? "Купить" : "Мало монет"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Patterns tab ─────────────────────────────────────────────────── */}
        {tab === "patterns" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in">
            {ALL_PATTERNS.map((pattern) => {
              const owned = playerPatterns.find((p) => p.id === pattern.id)?.owned ?? false;
              const canAfford = coins >= pattern.price;
              return (
                <div
                  key={pattern.id}
                  className={[
                    "card-bubble p-3 flex flex-col gap-2 transition-all duration-200",
                    owned ? "border-4 border-shop/40" : "",
                  ].join(" ")}
                >
                  {/* Pattern preview */}
                  <div className="overflow-hidden rounded-xl">
                    <PatternSwatch cssClass={pattern.cssClass} />
                  </div>

                  {/* Name */}
                  <div className="font-bold text-sm text-center text-foreground leading-tight">
                    {pattern.name}
                  </div>

                  {/* Price / owned */}
                  <div className="flex flex-col items-center gap-1.5">
                    {pattern.price === 0 ? (
                      <span className="text-xs font-bold text-shop">Бесплатно</span>
                    ) : (
                      <span className="badge-coin text-xs py-0.5 px-2">
                        🪙 {pattern.price}
                      </span>
                    )}

                    {owned ? (
                      <span className="inline-flex items-center gap-1 bg-shop/15 text-shop text-xs font-bold rounded-full px-3 py-1">
                        <Icon name="CheckCircle2" size={12} />
                        Есть ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() =>
                          handleBuy("pattern", pattern.id, pattern.price, pattern.name)
                        }
                        className={[
                          "btn-cartoon w-full text-xs px-3 py-1.5 text-center",
                          !canAfford ? "opacity-40 cursor-not-allowed" : "",
                        ].join(" ")}
                        style={{ background: canAfford ? "hsl(160 70% 45%)" : undefined }}
                      >
                        {canAfford ? "Купить" : "Мало 🪙"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Earn coins hint */}
        <div className="mt-8 card-bubble p-4 flex items-start gap-3 bg-gradient-to-r from-shop/10 to-transparent">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-bold text-sm text-foreground">Как заработать монеты?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Создавай наряды в Мастерской — каждый костюм приносит <strong>+10 🪙</strong>!
              Выполняй достижения для дополнительных наград.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
