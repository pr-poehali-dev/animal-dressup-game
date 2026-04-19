import React, { useState, useEffect } from "react";
import {
  getGlobalCostumes,
  type Player,
  type Costume,
} from "@/lib/gameStore";
import CostumePreview from "@/components/CostumePreview";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryProps {
  player: Player | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CostumeCardProps {
  costume: Costume;
  isOwn: boolean;
}

const CostumeCard: React.FC<CostumeCardProps> = ({ costume, isOwn }) => (
  <div
    className={[
      "card-bubble p-4 flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-1",
      isOwn ? "border-4 border-gallery/50" : "",
    ].join(" ")}
  >
    <CostumePreview
      animalEmoji={costume.animalEmoji}
      primaryColor={costume.primaryColor}
      secondaryColor={costume.secondaryColor}
      patternCss={costume.patternCss}
      clothType={costume.clothType}
      size="md"
      animate={isOwn}
    />

    {/* Costume name */}
    <div className="text-center w-full">
      <p className="font-pacifico text-sm text-gallery leading-tight line-clamp-2">
        {costume.name}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {costume.animalEmoji} {costume.animalName} · {costume.clothType}
      </p>
    </div>

    {/* Author & date */}
    <div className="w-full border-t border-border pt-2 flex items-center justify-between">
      <span className="text-[11px] font-bold text-foreground/80 flex items-center gap-1">
        <Icon name="User2" size={11} className="text-gallery" />
        {isOwn ? "Ты 🌟" : `от ${costume.playerName}`}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {formatDate(costume.createdAt)}
      </span>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Gallery: React.FC<GalleryProps> = ({ player }) => {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setCostumes(getGlobalCostumes());
  }, []);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = costumes.filter((c) => {
    if (filter === "mine" && player && c.playerId !== player.id) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.animalName.toLowerCase().includes(q) ||
        c.playerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const myCount = player ? costumes.filter((c) => c.playerId === player.id).length : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Title */}
        <h1 className="font-pacifico text-4xl text-gallery text-center drop-shadow mb-2">
          🖼️ Галерея нарядов
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Все созданные наряды со всего мира ✨
        </p>

        {/* Stats bar */}
        <div className="card-bubble px-5 py-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Shirt" size={18} className="text-gallery" />
            <span className="font-bold text-foreground">
              {costumes.length}
              <span className="font-normal text-muted-foreground text-sm ml-1">нарядов</span>
            </span>
          </div>
          {player && (
            <div className="flex items-center gap-2">
              <Icon name="Star" size={16} className="text-achieve" />
              <span className="font-bold text-achieve">{myCount} моих</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Search */}
          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или автору..."
              className="w-full rounded-2xl border-4 border-white bg-white pl-10 pr-4 py-2.5 text-sm font-bold placeholder:text-gray-300 outline-none focus:border-gallery/40 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          {player && (
            <div className="card-bubble p-1.5 flex gap-1">
              {(
                [
                  { key: "all", label: "🌍 Все наряды" },
                  { key: "mine", label: "⭐ Мои наряды" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={[
                    "flex-1 py-2 px-3 rounded-2xl font-bold text-sm transition-all duration-200",
                    filter === key
                      ? "bg-gallery text-white shadow-md"
                      : "text-muted-foreground hover:bg-gallery/10",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="card-bubble p-12 text-center animate-fade-in">
            {costumes.length === 0 ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🎨</div>
                <p className="font-pacifico text-xl text-gallery">Галерея пуста!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Пока нарядов нет — создай первый в Мастерской! 🎨
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">🔍</div>
                <p className="font-bold text-foreground">Ничего не найдено</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Попробуй другой запрос или сброси фильтры
                </p>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setFilter("all"); }}
                  className="mt-4 btn-cartoon text-sm px-5 py-2"
                  style={{ background: "hsl(330 90% 60%)" }}
                >
                  Сбросить
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 animate-fade-in">
            {filtered.map((costume) => (
              <CostumeCard
                key={costume.id}
                costume={costume}
                isOwn={!!player && costume.playerId === player.id}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        {filtered.length > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Показано {filtered.length} из {costumes.length} нарядов
          </p>
        )}
      </div>
    </div>
  );
};

export default Gallery;
