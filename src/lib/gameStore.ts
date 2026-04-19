export interface Animal {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  owned: boolean;
}

export interface Pattern {
  id: string;
  name: string;
  cssClass: string;
  price: number;
  owned: boolean;
}

export interface Costume {
  id: string;
  animalId: string;
  animalEmoji: string;
  animalName: string;
  name: string;
  clothType: string;
  material: string;
  patternId: string;
  patternName: string;
  patternCss: string;
  primaryColor: string;
  secondaryColor: string;
  createdAt: string;
  playerId: string;
  playerName: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rewardCoins: number;
  earned: boolean;
  earnedAt?: string;
}

export interface Player {
  id: string;
  nickname: string;
  codeWord: string;
  coins: number;
  createdAt: string;
}

export interface GameState {
  currentPlayer: Player | null;
  players: Player[];
  costumes: Costume[];
  globalCostumes: Costume[];
}

const KEY = "zveromode_v1";

export const ALL_ANIMALS: Animal[] = [
  { id: "cat",     name: "Котик",      emoji: "🐱", description: "Пушистый и игривый",    price: 0,   owned: false },
  { id: "dog",     name: "Щенок",      emoji: "🐶", description: "Верный друг",            price: 0,   owned: false },
  { id: "rabbit",  name: "Зайчик",     emoji: "🐰", description: "Прыгучий и быстрый",    price: 0,   owned: false },
  { id: "bear",    name: "Медвежонок", emoji: "🐻", description: "Сильный и добрый",       price: 150, owned: false },
  { id: "fox",     name: "Лисичка",    emoji: "🦊", description: "Хитрая красавица",       price: 200, owned: false },
  { id: "penguin", name: "Пингвин",    emoji: "🐧", description: "Элегантный модник",      price: 250, owned: false },
  { id: "unicorn", name: "Единорог",   emoji: "🦄", description: "Волшебное создание",     price: 500, owned: false },
  { id: "dragon",  name: "Дракон",     emoji: "🐲", description: "Огненный герой",         price: 600, owned: false },
];

export const ALL_PATTERNS: Pattern[] = [
  { id: "solid",     name: "Однотонный",  cssClass: "pattern-solid",     price: 0,   owned: false },
  { id: "stripes",   name: "Полоски",     cssClass: "pattern-stripes",   price: 0,   owned: false },
  { id: "dots",      name: "Горошек",     cssClass: "pattern-dots",      price: 0,   owned: false },
  { id: "checkers",  name: "Клетка",      cssClass: "pattern-checkers",  price: 100, owned: false },
  { id: "stars",     name: "Звёзды",      cssClass: "pattern-stars",     price: 150, owned: false },
  { id: "hearts",    name: "Сердечки",    cssClass: "pattern-hearts",    price: 150, owned: false },
  { id: "flowers",   name: "Цветы",       cssClass: "pattern-flowers",   price: 200, owned: false },
  { id: "lightning", name: "Молнии",      cssClass: "pattern-lightning", price: 200, owned: false },
];

export const DEFAULT_ANIMALS = ["cat", "dog", "rabbit"];
export const DEFAULT_PATTERNS = ["solid", "stripes", "dots"];

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_costume",   name: "Первый наряд",     description: "Создай свой первый костюм",         icon: "🎉", rewardCoins: 20,  earned: false },
  { id: "five_costumes",   name: "Дизайнер",          description: "Создай 5 костюмов",                 icon: "✨", rewardCoins: 50,  earned: false },
  { id: "twenty_costumes", name: "Модный дом",        description: "Создай 20 костюмов",                icon: "🏆", rewardCoins: 200, earned: false },
  { id: "collector",       name: "Коллекционер",      description: "Купи 3 животных в магазине",        icon: "🐾", rewardCoins: 100, earned: false },
  { id: "rich",            name: "Богач",             description: "Накопи 1000 монет",                 icon: "💰", rewardCoins: 50,  earned: false },
  { id: "shopaholic",      name: "Шопоголик",         description: "Купи 5 паттернов",                  icon: "🛍️", rewardCoins: 75,  earned: false },
  { id: "colorist",        name: "Мастер цвета",      description: "Используй 5 разных цветов",         icon: "🎨", rewardCoins: 60,  earned: false },
  { id: "gallery_star",    name: "Звезда галереи",    description: "Создай 10 публичных костюмов",      icon: "⭐", rewardCoins: 80,  earned: false },
];

export const CLOTH_TYPES = ["Платье", "Костюм", "Свитер", "Комбинезон", "Пальто", "Пижама", "Спортивный костюм", "Фрак"];
export const MATERIALS = ["Хлопок", "Шёлк", "Шерсть", "Бархат", "Кружево", "Джинса", "Трикотаж", "Парча"];
export const COLORS = [
  "#FF6B6B", "#FF9F43", "#FFEAA7", "#A8E6CF", "#74B9FF", "#A29BFE",
  "#FD79A8", "#00CEC9", "#6C5CE7", "#FDCB6E", "#E17055", "#0984E3",
  "#FFFFFF", "#2D3436", "#B2BEC3", "#DFE6E9",
];

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn("Store load error", e); }
  return { currentPlayer: null, players: [], costumes: [], globalCostumes: [] };
}

function saveState(state: GameState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getState(): GameState {
  return loadState();
}

export function getPlayerAnimals(playerId: string): Animal[] {
  const state = loadState();
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];
  const ownedKey = `owned_animals_${playerId}`;
  const owned: string[] = JSON.parse(localStorage.getItem(ownedKey) || JSON.stringify(DEFAULT_ANIMALS));
  return ALL_ANIMALS.map(a => ({ ...a, owned: owned.includes(a.id) }));
}

export function getPlayerPatterns(playerId: string): Pattern[] {
  const ownedKey = `owned_patterns_${playerId}`;
  const owned: string[] = JSON.parse(localStorage.getItem(ownedKey) || JSON.stringify(DEFAULT_PATTERNS));
  return ALL_PATTERNS.map(p => ({ ...p, owned: owned.includes(p.id) }));
}

export function getPlayerAchievements(playerId: string): Achievement[] {
  const key = `achievements_${playerId}`;
  const earned: string[] = JSON.parse(localStorage.getItem(key) || "[]");
  return ALL_ACHIEVEMENTS.map(a => ({
    ...a,
    earned: earned.includes(a.id),
    earnedAt: earned.includes(a.id) ? new Date().toISOString() : undefined,
  }));
}

export function getPlayerCostumes(playerId: string): Costume[] {
  const state = loadState();
  return state.costumes.filter(c => c.playerId === playerId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getGlobalCostumes(): Costume[] {
  const state = loadState();
  return [...state.costumes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getLeaderboard(): { id: string; nickname: string; coins: number; costumesCount: number; achievementsCount: number }[] {
  const state = loadState();
  return state.players
    .map(p => ({
      id: p.id,
      nickname: p.nickname,
      coins: p.coins,
      costumesCount: state.costumes.filter(c => c.playerId === p.id).length,
      achievementsCount: JSON.parse(localStorage.getItem(`achievements_${p.id}`) || "[]").length,
    }))
    .sort((a, b) => b.coins - a.coins);
}

export function login(codeWord: string): Player | null {
  const state = loadState();
  const player = state.players.find(p => p.codeWord === codeWord.toLowerCase().trim());
  if (!player) return null;
  state.currentPlayer = player;
  saveState(state);
  return player;
}

export function register(codeWord: string, nickname: string): Player | null {
  const state = loadState();
  const code = codeWord.toLowerCase().trim();
  if (state.players.find(p => p.codeWord === code)) return null;
  const player: Player = {
    id: Date.now().toString(),
    nickname: nickname.trim(),
    codeWord: code,
    coins: 100,
    createdAt: new Date().toISOString(),
  };
  state.players.push(player);
  state.currentPlayer = player;
  saveState(state);
  // Set default owned items
  localStorage.setItem(`owned_animals_${player.id}`, JSON.stringify(DEFAULT_ANIMALS));
  localStorage.setItem(`owned_patterns_${player.id}`, JSON.stringify(DEFAULT_PATTERNS));
  localStorage.setItem(`achievements_${player.id}`, JSON.stringify([]));
  return player;
}

export function logout() {
  const state = loadState();
  state.currentPlayer = null;
  saveState(state);
}

export function refreshCurrentPlayer(playerId: string): Player | null {
  const state = loadState();
  const player = state.players.find(p => p.id === playerId);
  if (player) {
    state.currentPlayer = player;
    saveState(state);
  }
  return player || null;
}

export function buyItem(playerId: string, type: "animal" | "pattern", itemId: string, price: number): { success: boolean; message: string; newCoins?: number } {
  const state = loadState();
  const pIdx = state.players.findIndex(p => p.id === playerId);
  if (pIdx === -1) return { success: false, message: "Игрок не найден" };
  if (state.players[pIdx].coins < price) return { success: false, message: "Недостаточно монет! 🪙" };

  const ownedKey = type === "animal" ? `owned_animals_${playerId}` : `owned_patterns_${playerId}`;
  const owned: string[] = JSON.parse(localStorage.getItem(ownedKey) || "[]");
  if (owned.includes(itemId)) return { success: false, message: "Уже куплено!" };

  owned.push(itemId);
  localStorage.setItem(ownedKey, JSON.stringify(owned));
  state.players[pIdx].coins -= price;
  state.currentPlayer = state.players[pIdx];
  saveState(state);

  checkAndAwardAchievements(state.players[pIdx], state);
  return { success: true, message: "Куплено!", newCoins: state.players[pIdx].coins };
}

export function createCostume(playerId: string, data: Omit<Costume, "id" | "createdAt" | "playerId" | "playerName">): Costume {
  const state = loadState();
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const costume: Costume = {
    ...data,
    id: Date.now().toString(),
    playerId,
    playerName: player.nickname,
    createdAt: new Date().toISOString(),
  };
  state.costumes.push(costume);
  // +10 coins per costume
  const pIdx = state.players.findIndex(p => p.id === playerId);
  state.players[pIdx].coins += 10;
  state.currentPlayer = state.players[pIdx];
  saveState(state);
  checkAndAwardAchievements(state.players[pIdx], state);
  return costume;
}

function awardAchievement(playerId: string, achievementId: string, coins: number, state: GameState) {
  const key = `achievements_${playerId}`;
  const earned: string[] = JSON.parse(localStorage.getItem(key) || "[]");
  if (!earned.includes(achievementId)) {
    earned.push(achievementId);
    localStorage.setItem(key, JSON.stringify(earned));
    const pIdx = state.players.findIndex(p => p.id === playerId);
    if (pIdx !== -1) {
      state.players[pIdx].coins += coins;
      state.currentPlayer = state.players[pIdx];
      saveState(state);
    }
  }
}

function checkAndAwardAchievements(player: Player, state: GameState) {
  const costumes = state.costumes.filter(c => c.playerId === player.id);
  const ownedAnimals: string[] = JSON.parse(localStorage.getItem(`owned_animals_${player.id}`) || "[]");
  const ownedPatterns: string[] = JSON.parse(localStorage.getItem(`owned_patterns_${player.id}`) || "[]");
  const boughtAnimals = ownedAnimals.filter(id => !DEFAULT_ANIMALS.includes(id));
  const boughtPatterns = ownedPatterns.filter(id => !DEFAULT_PATTERNS.includes(id));
  const uniqueColors = new Set(costumes.map(c => c.primaryColor)).size;

  if (costumes.length >= 1)  awardAchievement(player.id, "first_costume",   20,  state);
  if (costumes.length >= 5)  awardAchievement(player.id, "five_costumes",   50,  state);
  if (costumes.length >= 20) awardAchievement(player.id, "twenty_costumes", 200, state);
  if (boughtAnimals.length >= 3)  awardAchievement(player.id, "collector",  100, state);
  if (player.coins >= 1000)       awardAchievement(player.id, "rich",        50, state);
  if (boughtPatterns.length >= 5) awardAchievement(player.id, "shopaholic",  75, state);
  if (uniqueColors >= 5)          awardAchievement(player.id, "colorist",    60, state);
  if (costumes.length >= 10)      awardAchievement(player.id, "gallery_star",80, state);
}