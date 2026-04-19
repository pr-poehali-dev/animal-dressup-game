import React, { useState } from "react";
import {
  getPlayerCostumes,
  getPlayerAchievements,
  type Player,
  type Costume,
  type Achievement,
} from "@/lib/gameStore";
import CostumePreview from "@/components/CostumePreview";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileProps {
  player: Player;
  onLogout: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CostumeCardProps {
  costume: Costume;
}

const CostumeCard: React.FC<CostumeCardProps> = ({ costume }) => (
  <div className="card-bubble p-3 flex flex-col items-center gap-2 animate-scale-in">
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
        {costume.animalEmoji} {costume.animalName}
      </p>
      <p className="text-[10px] text-muted-foreground">{formatDate(costume.createdAt)}</p>
    </div>
  </div>
);

interface AchievementBadgeProps {
  achievement: Achievement;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement }) => (
  <div
    className={[
      "card-bubble p-3 flex flex-col items-center gap-1.5 text-center transition-all duration-200",
      achievement.earned
        ? "border-4 border-achieve/50 shadow-lg"
        : "opacity-40 grayscale",
    ].join(" ")}
    title={achievement.description}
  >
    <span className="text-3xl leading-none">{achievement.icon}</span>
    <span
      className={[
        "text-xs font-bold leading-tight",
        achievement.earned ? "text-foreground" : "text-muted-foreground",
      ].join(" ")}
    >
      {achievement.name}
    </span>
    {achievement.earned && (
      <span className="badge-coin text-[10px] py-0 px-1.5">
        +{achievement.rewardCoins} 🪙
      </span>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Profile: React.FC<ProfileProps> = ({ player, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const costumes = getPlayerCostumes(player.id);
  const achievements = getPlayerAchievements(player.id);
  const earnedCount = achievements.filter((a) => a.earned).length;

  const joinDate = formatDate(player.createdAt);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="card-bubble p-6 text-center bg-gradient-to-b from-game-profile/15 to-white">
          {/* Avatar bubble */}
          <div className="w-20 h-20 rounded-full bg-game-profile/20 border-4 border-game-profile/40 flex items-center justify-center text-5xl mx-auto mb-3 animate-float">
            🎀
          </div>

          <h1 className="font-pacifico text-3xl text-game-profile break-words">
            {player.nickname}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Играет с {joinDate}
          </p>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-2xl py-2 px-1 flex flex-col items-center">
              <span className="badge-coin text-base px-3 py-1">🪙 {player.coins}</span>
              <span className="text-[10px] text-muted-foreground mt-1">монет</span>
            </div>
            <div className="bg-muted rounded-2xl py-2 px-1 flex flex-col items-center">
              <span className="font-pacifico text-xl text-game-profile">{costumes.length}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">нарядов</span>
            </div>
            <div className="bg-muted rounded-2xl py-2 px-1 flex flex-col items-center">
              <span className="font-pacifico text-xl text-achieve">
                {earnedCount}/{achievements.length}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">наград</span>
            </div>
          </div>
        </div>

        {/* ── Costume history ────────────────────────────────────────────── */}
        <section>
          <h2 className="font-pacifico text-2xl text-game-profile mb-3 flex items-center gap-2">
            <Icon name="Shirt" size={22} className="text-game-profile" />
            Мои наряды
          </h2>

          {costumes.length === 0 ? (
            <div className="card-bubble p-8 text-center">
              <div className="text-5xl mb-3 animate-bounce">🎨</div>
              <p className="font-bold text-foreground">Ещё нет нарядов!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Зайди в Мастерскую и создай свой первый наряд 🎨
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {costumes.map((costume) => (
                <CostumeCard key={costume.id} costume={costume} />
              ))}
            </div>
          )}
        </section>

        {/* ── Achievements ───────────────────────────────────────────────── */}
        <section>
          <h2 className="font-pacifico text-2xl text-achieve mb-3 flex items-center gap-2">
            <Icon name="Trophy" size={22} className="text-achieve" />
            Достижения
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {achievements.map((ach) => (
              <AchievementBadge key={ach.id} achievement={ach} />
            ))}
          </div>

          {earnedCount === 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Начни создавать наряды, чтобы открывать достижения! ✨
            </p>
          )}
        </section>

        {/* ── Logout ─────────────────────────────────────────────────────── */}
        <div className="card-bubble p-4 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground text-center">
            Твой код для входа: <strong className="font-mono text-foreground">{player.codeWord}</strong>
            <br />Не теряй его! 🔑
          </p>

          {!showLogoutConfirm ? (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="btn-cartoon flex items-center gap-2"
              style={{ background: "hsl(0 84% 60%)" }}
            >
              <Icon name="LogOut" size={16} />
              Выйти из аккаунта
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="text-sm font-bold text-foreground">Точно выходим? 😢</p>
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-cartoon flex-1"
                  style={{ background: "hsl(160 70% 45%)" }}
                >
                  Остаться
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="btn-cartoon flex-1"
                  style={{ background: "hsl(0 84% 60%)" }}
                >
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
