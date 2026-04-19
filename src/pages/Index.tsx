import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { getState, login, register, logout, refreshCurrentPlayer, type Player } from "@/lib/gameStore";
import Workshop from "./Workshop";
import Shop from "./Shop";
import Profile from "./Profile";
import Gallery from "./Gallery";
import Zoo from "./Zoo";
import Achievements from "./Achievements";
import Leaderboard from "./Leaderboard";

type Tab = "workshop" | "shop" | "profile" | "gallery" | "zoo" | "achievements" | "leaderboard";

const NAV_ITEMS: { id: Tab; label: string; icon: string; emoji: string; color: string }[] = [
  { id: "workshop",    label: "Мастерская",  icon: "Scissors",   emoji: "✂️",  color: "#a855f7" },
  { id: "shop",        label: "Магазин",     icon: "ShoppingBag", emoji: "🛒", color: "#10b981" },
  { id: "gallery",     label: "Галерея",     icon: "Images",      emoji: "🖼️", color: "#ec4899" },
  { id: "zoo",         label: "Зоопарк",     icon: "TreePine",    emoji: "🦁", color: "#f97316" },
  { id: "achievements",label: "Медали",      icon: "Trophy",      emoji: "🏆", color: "#eab308" },
  { id: "leaderboard", label: "Рейтинг",     icon: "BarChart3",   emoji: "🌍", color: "#6366f1" },
  { id: "profile",     label: "Профиль",     icon: "User",        emoji: "👤", color: "#0ea5e9" },
];

export default function Index() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [tab, setTab] = useState<Tab>("gallery");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [codeWord, setCodeWord] = useState("");
  const [nickname, setNickname] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const state = getState();
    if (state.currentPlayer) {
      const fresh = refreshCurrentPlayer(state.currentPlayer.id);
      setPlayer(fresh);
      setCoins(fresh?.coins ?? 0);
      setTab("workshop");
    }
  }, []);

  const refreshCoins = useCallback(() => {
    if (player) {
      const fresh = refreshCurrentPlayer(player.id);
      setPlayer(fresh);
      setCoins(fresh?.coins ?? 0);
    }
  }, [player]);

  const handleLogin = () => {
    setAuthLoading(true);
    setAuthError("");
    setTimeout(() => {
      const p = login(codeWord);
      if (p) { setPlayer(p); setCoins(p.coins); setShowAuth(false); setTab("workshop"); }
      else setAuthError("Кодовое слово не найдено. Попробуй ещё раз!");
      setAuthLoading(false);
    }, 300);
  };

  const handleRegister = () => {
    if (codeWord.trim().length < 3) { setAuthError("Кодовое слово — минимум 3 символа"); return; }
    if (nickname.trim().length < 2) { setAuthError("Никнейм — минимум 2 символа"); return; }
    setAuthLoading(true);
    setAuthError("");
    setTimeout(() => {
      const p = register(codeWord, nickname);
      if (p) { setPlayer(p); setCoins(p.coins); setShowAuth(false); setTab("workshop"); }
      else setAuthError("Это кодовое слово уже занято! Придумай другое.");
      setAuthLoading(false);
    }, 300);
  };

  const handleLogout = () => {
    logout();
    setPlayer(null);
    setCoins(0);
    setTab("gallery");
  };

  const renderContent = () => {
    switch (tab) {
      case "workshop":    return player ? <Workshop player={player} onCoinsUpdate={refreshCoins} /> : <NeedLogin onLogin={() => setShowAuth(true)} />;
      case "shop":        return player ? <Shop player={player} onCoinsUpdate={refreshCoins} /> : <NeedLogin onLogin={() => setShowAuth(true)} />;
      case "profile":     return player ? <Profile player={player} onLogout={handleLogout} /> : <NeedLogin onLogin={() => setShowAuth(true)} />;
      case "gallery":     return <Gallery player={player} />;
      case "zoo":         return <Zoo player={player} />;
      case "achievements":return <Achievements player={player} />;
      case "leaderboard": return <Leaderboard player={player} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(255,250,240,0.92)", backdropFilter: "blur(12px)", borderBottom: "3px solid hsl(45,40%,85%)" }}>
        <div className="font-pacifico text-2xl" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Зверомода
        </div>
        {player ? (
          <div className="flex items-center gap-2">
            <span className="badge-coin text-base">🪙 {coins}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm cursor-pointer"
              onClick={() => setTab("profile")}>
              {player.nickname[0].toUpperCase()}
            </div>
          </div>
        ) : (
          <button className="btn-cartoon text-sm py-2 px-4" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
            onClick={() => setShowAuth(true)}>
            Войти
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        <div className="animate-fade-in" key={tab}>
          {renderContent()}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-2 pb-2">
        <div className="card-bubble flex items-center justify-around py-2 px-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}>
              <span className="text-xl leading-none">{item.emoji}</span>
              <span className={`text-[10px] font-bold ${tab === item.id ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Auth modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div className="card-bubble w-full max-w-sm p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-5xl mb-2 animate-float inline-block">🎪</div>
              <h2 className="font-pacifico text-2xl text-foreground">
                {authMode === "login" ? "Добро пожаловать!" : "Создать профиль"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {authMode === "login" ? "Введи своё кодовое слово" : "Придумай никнейм и кодовое слово"}
              </p>
            </div>

            <div className="space-y-3">
              {authMode === "register" && (
                <div>
                  <label className="text-sm font-bold text-foreground mb-1 block">Никнейм</label>
                  <input
                    className="w-full rounded-2xl border-3 border-border bg-muted px-4 py-3 text-foreground font-nunito font-semibold outline-none focus:border-purple-400 transition-colors"
                    placeholder="Твоё имя в игре..."
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRegister()}
                    style={{ border: "3px solid hsl(var(--border))" }}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block">Кодовое слово</label>
                <input
                  className="w-full rounded-2xl px-4 py-3 text-foreground font-nunito font-semibold outline-none focus:border-purple-400 transition-colors"
                  placeholder="Секретное слово..."
                  value={codeWord}
                  onChange={e => setCodeWord(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())}
                  style={{ border: "3px solid hsl(var(--border))", background: "hsl(var(--muted))" }}
                />
                <p className="text-xs text-muted-foreground mt-1">Запомни его — он нужен для входа!</p>
              </div>

              {authError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-2 text-red-600 text-sm font-semibold">
                  {authError}
                </div>
              )}

              <button
                className="btn-cartoon w-full text-base py-3 mt-2"
                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
                onClick={authMode === "login" ? handleLogin : handleRegister}
                disabled={authLoading}
              >
                {authLoading ? "⏳ Загрузка..." : authMode === "login" ? "🚪 Войти" : "🎉 Создать профиль!"}
              </button>

              <button className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => { setAuthMode(m => m === "login" ? "register" : "login"); setAuthError(""); }}>
                {authMode === "login" ? "Нет профиля? Создать →" : "← Уже есть профиль? Войти"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NeedLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="text-7xl animate-float">🔐</div>
      <div>
        <h2 className="font-pacifico text-2xl text-foreground mb-2">Нужен профиль!</h2>
        <p className="text-muted-foreground">Войди или создай профиль, чтобы начать одевать зверят</p>
      </div>
      <button className="btn-cartoon text-lg py-3 px-8"
        style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
        onClick={onLogin}>
        🎪 Войти в игру
      </button>
    </div>
  );
}
