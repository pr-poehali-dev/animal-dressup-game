import React, { useState, useEffect } from "react";
import {
  getLeaderboard,
  type Player,
} from "@/lib/gameStore";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardProps {
  player: Player | null;
}

interface LeaderEntry {
  id: string;
  nickname: string;
  coins: number;
  costumesCount: number;
  achievementsCount: number;
}

// ─── Podium config ────────────────────────────────────────────────────────────

const PODIUM = [
  {
    rank: 1,
    medal: "🥇",
    label: "1 место",
    bg: "linear-gradient(145deg, #fff9e0, #fef3b0)",
    border: "border-yellow-400",
    textColor: "text-yellow-700",
    shadow: "shadow-yellow-200",
    size: "text-5xl",
    avatarBg: "bg-yellow-100",
    avatarBorder: "border-yellow-400",
    height: "h-20",
  },
  {
    rank: 2,
    medal: "🥈",
    label: "2 место",
    bg: "linear-gradient(145deg, #f4f4f8, #e8e8f0)",
    border: "border-gray-300",
    textColor: "text-gray-600",
    shadow: "shadow-gray-200",
    size: "text-4xl",
    avatarBg: "bg-gray-100",
    avatarBorder: "border-gray-300",
    height: "h-14",
  },
  {
    rank: 3,
    medal: "🥉",
    label: "3 место",
    bg: "linear-gradient(145deg, #fff3ec, #ffe8d6)",
    border: "border-orange-300",
    textColor: "text-orange-700",
    shadow: "shadow-orange-100",
    size: "text-4xl",
    avatarBg: "bg-orange-50",
    avatarBorder: "border-orange-300",
    height: "h-14",
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nicknameInitial(nickname: string): string {
  return (nickname[0] ?? "?").toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PodiumCardProps {
  entry: LeaderEntry;
  podiumCfg: (typeof PODIUM)[number];
  isCurrentPlayer: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ entry, podiumCfg, isCurrentPlayer }) => (
  <div
    className={[
      "card-bubble p-4 flex flex-col items-center gap-2 border-4 relative overflow-hidden transition-all duration-300",
      podiumCfg.border,
      podiumCfg.shadow,
      isCurrentPlayer ? "ring-4 ring-workshop ring-offset-2" : "",
      podiumCfg.rank === 1 ? "scale-105 z-10" : "",
    ].join(" ")}
    style={{ background: podiumCfg.bg }}
  >
    {/* Shimmer stripe */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
      }}
    />

    {/* Medal */}
    <span className={podiumCfg.size}>{podiumCfg.medal}</span>

    {/* Avatar circle */}
    <div
      className={[
        "w-12 h-12 rounded-full border-4 flex items-center justify-center font-pacifico text-xl",
        podiumCfg.avatarBg,
        podiumCfg.avatarBorder,
        podiumCfg.textColor,
      ].join(" ")}
    >
      {nicknameInitial(entry.nickname)}
    </div>

    {/* Nickname */}
    <div className="text-center">
      <p
        className={[
          "font-pacifico text-sm leading-tight break-all",
          podiumCfg.textColor,
        ].join(" ")}
      >
        {entry.nickname}
        {isCurrentPlayer && (
          <span className="ml-1 text-workshop text-xs">★</span>
        )}
      </p>
      <p className={["text-[10px] font-bold mt-0.5", podiumCfg.textColor].join(" ")}>
        {podiumCfg.label}
      </p>
    </div>

    {/* Coins */}
    <span className="badge-coin text-xs py-0.5 px-2">🪙 {entry.coins}</span>

    {/* Mini stats */}
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-0.5">
        <Icon name="Shirt" size={10} />
        {entry.costumesCount}
      </span>
      <span className="flex items-center gap-0.5">
        <Icon name="Trophy" size={10} />
        {entry.achievementsCount}
      </span>
    </div>
  </div>
);

interface ListRowProps {
  entry: LeaderEntry;
  rank: number;
  isCurrentPlayer: boolean;
}

const ListRow: React.FC<ListRowProps> = ({ entry, rank, isCurrentPlayer }) => (
  <div
    className={[
      "card-bubble px-4 py-3 flex items-center gap-3 transition-all duration-200",
      isCurrentPlayer
        ? "border-4 border-workshop bg-gradient-to-r from-workshop/10 to-white"
        : "hover:shadow-md",
    ].join(" ")}
  >
    {/* Rank number */}
    <div
      className={[
        "w-8 h-8 rounded-xl flex items-center justify-center font-pacifico text-sm flex-shrink-0",
        isCurrentPlayer
          ? "bg-workshop text-white"
          : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {rank}
    </div>

    {/* Avatar */}
    <div
      className={[
        "w-9 h-9 rounded-full border-2 flex items-center justify-center font-pacifico text-sm flex-shrink-0",
        isCurrentPlayer
          ? "bg-workshop/20 border-workshop text-workshop"
          : "bg-muted border-border text-muted-foreground",
      ].join(" ")}
    >
      {nicknameInitial(entry.nickname)}
    </div>

    {/* Name */}
    <div className="flex-1 min-w-0">
      <p
        className={[
          "font-bold text-sm truncate",
          isCurrentPlayer ? "text-workshop" : "text-foreground",
        ].join(" ")}
      >
        {entry.nickname}
        {isCurrentPlayer && <span className="ml-1.5 text-xs">★ Это ты!</span>}
      </p>
      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Icon name="Shirt" size={10} />
          {entry.costumesCount} нарядов
        </span>
        <span className="flex items-center gap-0.5">
          <Icon name="Trophy" size={10} />
          {entry.achievementsCount} наград
        </span>
      </div>
    </div>

    {/* Coins */}
    <span className="badge-coin text-xs py-0.5 px-2 flex-shrink-0">🪙 {entry.coins}</span>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="card-bubble p-12 text-center mt-4 animate-fade-in">
    <div className="text-6xl mb-4 animate-bounce-in">🚀</div>
    <p className="font-pacifico text-2xl text-workshop mb-2">Рейтинг пуст!</p>
    <p className="text-sm text-muted-foreground leading-relaxed">
      Пока никто не играет — будь первым! 🚀
      <br />
      Зарегистрируйся и создай свой первый наряд.
    </p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Leaderboard: React.FC<LeaderboardProps> = ({ player }) => {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    setLeaders(getLeaderboard());
  }, []);

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const currentPlayerRank = player
    ? leaders.findIndex((l) => l.id === player.id)
    : -1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Title */}
        <h1 className="font-pacifico text-4xl text-center drop-shadow mb-2"
          style={{ color: "hsl(270 70% 55%)" }}
        >
          🌍 Мировой рейтинг
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Лучшие модельеры нашей игры ✨
        </p>

        {leaders.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Your position banner (when logged in and outside top 3) ── */}
            {player && currentPlayerRank >= 3 && (
              <div className="card-bubble px-4 py-3 mb-5 border-4 border-workshop bg-gradient-to-r from-workshop/10 to-white flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-workshop text-white flex items-center justify-center font-pacifico text-sm flex-shrink-0">
                  {currentPlayerRank + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-workshop truncate">
                    ★ Твоя позиция: #{currentPlayerRank + 1}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Создавай больше нарядов, чтобы подняться!
                  </p>
                </div>
                <span className="badge-coin text-xs py-0.5 px-2 flex-shrink-0">
                  🪙 {player.coins}
                </span>
              </div>
            )}

            {player && currentPlayerRank === -1 && (
              <div className="card-bubble px-4 py-3 mb-5 border-4 border-dashed border-muted-foreground/30 flex items-center gap-3">
                <Icon name="UserX" size={20} className="text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Тебя пока нет в рейтинге — создай первый наряд, чтобы попасть!
                </p>
              </div>
            )}

            {/* ── Podium (top 1-3) ───────────────────────────────────────── */}
            {top3.length > 0 && (
              <section className="mb-6">
                <h2 className="font-pacifico text-xl mb-4 flex items-center gap-2"
                  style={{ color: "hsl(43 96% 46%)" }}
                >
                  <Icon name="Crown" size={20} style={{ color: "hsl(43 96% 46%)" }} />
                  Пьедестал почёта
                </h2>

                {/* Podium layout: 2nd | 1st | 3rd */}
                <div className="grid grid-cols-3 gap-3 items-end">
                  {/* Slot order: [1]=2nd, [0]=1st, [2]=3rd */}
                  {[top3[1], top3[0], top3[2]].map((entry, slotIdx) => {
                    if (!entry) {
                      // Empty podium slot
                      return (
                        <div
                          key={`empty-${slotIdx}`}
                          className="card-bubble p-4 flex flex-col items-center gap-2 border-4 border-dashed border-gray-200 opacity-40"
                        >
                          <span className="text-4xl">
                            {slotIdx === 0 ? "🥈" : slotIdx === 1 ? "🥇" : "🥉"}
                          </span>
                          <p className="text-xs text-muted-foreground">Вакансия</p>
                        </div>
                      );
                    }
                    // Map slot index back to podium config rank
                    const podiumRank = slotIdx === 0 ? 2 : slotIdx === 1 ? 1 : 3;
                    const cfg = PODIUM.find((p) => p.rank === podiumRank)!;
                    return (
                      <PodiumCard
                        key={entry.id}
                        entry={entry}
                        podiumCfg={cfg}
                        isCurrentPlayer={!!player && entry.id === player.id}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Rest of leaderboard ────────────────────────────────────── */}
            {rest.length > 0 && (
              <section>
                <h2 className="font-pacifico text-xl mb-3"
                  style={{ color: "hsl(270 70% 55%)" }}
                >
                  Остальные участники
                </h2>

                <div className="flex flex-col gap-2 animate-fade-in">
                  {rest.map((entry, i) => (
                    <ListRow
                      key={entry.id}
                      entry={entry}
                      rank={i + 4}
                      isCurrentPlayer={!!player && entry.id === player.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Global stats footer ────────────────────────────────────── */}
            <div className="mt-8 card-bubble p-4 grid grid-cols-3 gap-3 text-center bg-gradient-to-r from-workshop/10 to-transparent">
              <div>
                <p className="font-pacifico text-2xl" style={{ color: "hsl(270 70% 55%)" }}>
                  {leaders.length}
                </p>
                <p className="text-[11px] text-muted-foreground">игроков</p>
              </div>
              <div>
                <p className="font-pacifico text-2xl text-achieve">
                  {leaders.reduce((s, l) => s + l.costumesCount, 0)}
                </p>
                <p className="text-[11px] text-muted-foreground">нарядов всего</p>
              </div>
              <div>
                <p className="font-pacifico text-2xl text-coin">
                  {leaders[0]?.coins ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">монет у лидера</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
