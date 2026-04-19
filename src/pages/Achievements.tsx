import React, { useState, useEffect } from "react";
import {
  getPlayerAchievements,
  ALL_ACHIEVEMENTS,
  type Player,
  type Achievement,
} from "@/lib/gameStore";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementsProps {
  player: Player | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProgressBarProps {
  earned: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ earned, total }) => {
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);

  return (
    <div className="card-bubble p-4 mb-6">
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-pacifico text-achieve text-lg">Прогресс</span>
        <span className="badge-coin">
          {earned} / {total}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-5 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, hsl(43 96% 56%), hsl(35 100% 55%))",
          }}
        />
        {/* Shine stripe */}
        {pct > 0 && (
          <div
            className="absolute inset-y-1 left-1 rounded-full opacity-40"
            style={{
              width: `${Math.max(pct - 4, 0)}%`,
              background: "linear-gradient(90deg, rgba(255,255,255,0.8), transparent)",
            }}
          />
        )}
      </div>

      {/* Motivational line */}
      <p className="mt-2 text-xs text-muted-foreground text-center">
        {pct === 100
          ? "Поздравляем — все достижения получены! 🎊"
          : pct >= 50
          ? `Больше половины — так держать! ✨`
          : `Ещё ${total - earned} достижений впереди — не останавливайся! 🚀`}
      </p>
    </div>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, index }) => {
  const earned = achievement.earned;

  return (
    <div
      className={[
        "card-bubble p-4 flex flex-col items-center gap-2 text-center relative overflow-hidden",
        "transition-all duration-300",
        earned
          ? "border-4 border-yellow-400 shadow-xl"
          : "opacity-60",
      ].join(" ")}
      style={
        earned
          ? {
              animationDelay: `${index * 60}ms`,
              background: "linear-gradient(145deg, #fffbea, #ffffff)",
            }
          : undefined
      }
    >
      {/* Earned shimmer sweep */}
      {earned && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,220,50,0.18) 50%, transparent 70%)",
          }}
        />
      )}

      {/* Icon */}
      <div className="relative">
        <span
          className={["leading-none select-none", earned ? "animate-bounce-in" : ""].join(" ")}
          style={{ fontSize: "3rem" }}
        >
          {achievement.icon}
        </span>
        {/* Locked overlay */}
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 rounded-full p-1">
              <Icon name="Lock" size={14} className="text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <p
        className={[
          "font-bold text-sm leading-tight",
          earned ? "text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {achievement.name}
      </p>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-tight">
        {achievement.description}
      </p>

      {/* Reward badge */}
      <div className="mt-auto pt-1">
        {earned ? (
          <div className="flex flex-col items-center gap-1">
            <span className="badge-coin text-xs py-0.5 px-2">
              🪙 +{achievement.rewardCoins}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600">
              <Icon name="CheckCircle2" size={12} />
              Получено! ✓
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Icon name="Gift" size={11} />
            {achievement.rewardCoins} монет
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Login prompt ─────────────────────────────────────────────────────────────

const LoginPrompt: React.FC = () => (
  <div className="card-bubble p-10 text-center mt-6 mx-auto max-w-sm">
    <div className="text-6xl mb-4 animate-bounce-in">🔑</div>
    <h2 className="font-pacifico text-2xl text-achieve mb-2">Нужен аккаунт!</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">
      Войди в профиль, чтобы видеть свои достижения!
    </p>
    <div className="mt-5 flex flex-col gap-2">
      {/* Preview of locked cards */}
      <div className="grid grid-cols-4 gap-1.5 opacity-40 pointer-events-none select-none">
        {ALL_ACHIEVEMENTS.slice(0, 4).map((a) => (
          <div
            key={a.id}
            className="card-bubble p-2 flex flex-col items-center gap-1"
          >
            <span className="text-xl grayscale">{a.icon}</span>
            <Icon name="Lock" size={10} className="text-muted-foreground" />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {ALL_ACHIEVEMENTS.length} достижений ждут тебя
      </p>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Achievements: React.FC<AchievementsProps> = ({ player }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(
    player ? getPlayerAchievements(player.id) : ALL_ACHIEVEMENTS,
  );
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  useEffect(() => {
    if (player) {
      setAchievements(getPlayerAchievements(player.id));
    } else {
      setAchievements(ALL_ACHIEVEMENTS);
    }
  }, [player]);

  const earnedCount = achievements.filter((a) => a.earned).length;
  const total = achievements.length;

  const visible = achievements.filter((a) => {
    if (filter === "earned") return a.earned;
    if (filter === "locked") return !a.earned;
    return true;
  });

  // Sort: earned first, then locked
  const sorted = [...visible].sort((a, b) => {
    if (a.earned === b.earned) return 0;
    return a.earned ? -1 : 1;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Title */}
        <h1 className="font-pacifico text-4xl text-achieve text-center drop-shadow mb-2">
          🏆 Достижения
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Выполняй задания и получай монеты в награду!
        </p>

        {!player ? (
          <LoginPrompt />
        ) : (
          <>
            {/* Progress bar */}
            <ProgressBar earned={earnedCount} total={total} />

            {/* Summary chips */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full px-3 py-1.5">
                <Icon name="Trophy" size={13} />
                {earnedCount} получено
              </span>
              <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-bold rounded-full px-3 py-1.5">
                <Icon name="Lock" size={13} />
                {total - earnedCount} заблокировано
              </span>
              {earnedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full px-3 py-1.5">
                  <Icon name="Coins" size={13} />
                  +{achievements
                    .filter((a) => a.earned)
                    .reduce((s, a) => s + a.rewardCoins, 0)}{" "}
                  монет заработано
                </span>
              )}
            </div>

            {/* Filter tabs */}
            <div className="card-bubble p-1.5 flex gap-1 mb-6">
              {(
                [
                  { key: "all",    label: "Все",         icon: "LayoutGrid" },
                  { key: "earned", label: "Получены",     icon: "CheckCircle2" },
                  { key: "locked", label: "Заблокированы", icon: "Lock" },
                ] as const
              ).map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={[
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-2xl font-bold text-xs transition-all duration-200",
                    filter === key
                      ? "bg-achieve text-white shadow-md"
                      : "text-muted-foreground hover:bg-achieve/10",
                  ].join(" ")}
                >
                  <Icon name={icon} size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Achievement grid */}
            {sorted.length === 0 ? (
              <div className="card-bubble p-10 text-center">
                <div className="text-5xl mb-3">
                  {filter === "earned" ? "😢" : "🎉"}
                </div>
                <p className="font-bold text-foreground">
                  {filter === "earned"
                    ? "Ещё нет полученных достижений"
                    : "Все достижения получены!"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter === "earned"
                    ? "Создавай наряды и делай покупки, чтобы получить первое! 🚀"
                    : "Ты настоящий чемпион! 🏆"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in">
                {sorted.map((ach, i) => (
                  <AchievementCard key={ach.id} achievement={ach} index={i} />
                ))}
              </div>
            )}

            {/* Rewards total hint */}
            <div className="mt-8 card-bubble p-4 flex items-start gap-3 bg-gradient-to-r from-achieve/10 to-transparent">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-sm text-foreground">Как получить достижения?</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Создавай новые наряды в Мастерской, покупай животных и узоры в Магазине,
                  собирай монеты — и достижения откроются сами!
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Achievements;
