import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p19850081_animal_dressup_game"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Player-Id",
        "Content-Type": "application/json"
    }

def ok(data):
    return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": cors_headers(), "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    """Главный API игры: профиль, животные, паттерны, костюмы, магазин, достижения, рейтинг."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    raw_path = event.get("path", "/")
    # Normalize: strip function-id prefix, keep meaningful route parts
    parts = [p for p in raw_path.split("/") if p]
    # route1 = last segment, route2 = last two segments joined
    route1 = parts[-1] if parts else ""
    route2 = "/".join(parts[-2:]) if len(parts) >= 2 else route1

    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # --- PROFILE ---
    if route2 == "profile/login" and method == "POST":
        return profile_login(body)
    if route2 == "profile/register" and method == "POST":
        return profile_register(body)
    if route1 == "profile" and method == "GET":
        return profile_get(params)

    # --- ANIMALS ---
    if route1 == "animals" and method == "GET":
        return animals_list(params)

    # --- PATTERNS ---
    if route1 == "patterns" and method == "GET":
        return patterns_list(params)

    # --- COSTUMES ---
    if route1 == "costumes" and method == "GET":
        return costumes_list(params)
    if route1 == "costumes" and method == "POST":
        return costumes_create(body)

    # --- SHOP ---
    if route2 == "shop/buy" and method == "POST":
        return shop_buy(body)

    # --- ACHIEVEMENTS ---
    if route1 == "achievements" and method == "GET":
        return achievements_list(params)

    # --- GALLERY ---
    if route1 == "gallery" and method == "GET":
        return gallery_list(params)

    # --- LEADERBOARD ---
    if route1 == "leaderboard" and method == "GET":
        return leaderboard_get()

    return err("Not found", 404)


def profile_login(body):
    code = body.get("code_word", "").strip().lower()
    if not code:
        return err("Введи кодовое слово")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"SELECT * FROM {SCHEMA}.players WHERE code_word = %s", (code,))
    player = cur.fetchone()
    conn.close()
    if not player:
        return err("Игрок не найден")
    return ok({"player": dict(player)})


def profile_register(body):
    code = body.get("code_word", "").strip().lower()
    nickname = body.get("nickname", "").strip()
    if not code or len(code) < 3:
        return err("Кодовое слово должно быть не менее 3 символов")
    if not nickname or len(nickname) < 2:
        return err("Никнейм должен быть не менее 2 символов")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"SELECT id FROM {SCHEMA}.players WHERE code_word = %s", (code,))
    if cur.fetchone():
        conn.close()
        return err("Это кодовое слово уже занято")
    cur.execute(
        f"INSERT INTO {SCHEMA}.players (code_word, nickname, coins) VALUES (%s, %s, 100) RETURNING *",
        (code, nickname)
    )
    player = cur.fetchone()
    # Открываем базовых животных
    cur.execute(f"SELECT id FROM {SCHEMA}.animals WHERE is_default = TRUE")
    for a in cur.fetchall():
        cur.execute(
            f"INSERT INTO {SCHEMA}.player_animals (player_id, animal_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (player["id"], a["id"])
        )
    # Открываем базовые паттерны
    cur.execute(f"SELECT id FROM {SCHEMA}.patterns WHERE is_default = TRUE")
    for p in cur.fetchall():
        cur.execute(
            f"INSERT INTO {SCHEMA}.player_patterns (player_id, pattern_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (player["id"], p["id"])
        )
    conn.commit()
    conn.close()
    return ok({"player": dict(player)})


def profile_get(params):
    player_id = params.get("player_id")
    if not player_id:
        return err("Нет player_id")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"SELECT * FROM {SCHEMA}.players WHERE id = %s", (player_id,))
    player = cur.fetchone()
    if not player:
        conn.close()
        return err("Игрок не найден", 404)
    # Костюмы игрока
    cur.execute(f"""
        SELECT c.*, a.name as animal_name, a.emoji as animal_emoji, p.name as pattern_name, p.css_value as pattern_css
        FROM {SCHEMA}.costumes c
        JOIN {SCHEMA}.animals a ON c.animal_id = a.id
        JOIN {SCHEMA}.patterns p ON c.pattern_id = p.id
        WHERE c.player_id = %s ORDER BY c.created_at DESC
    """, (player_id,))
    costumes = [dict(r) for r in cur.fetchall()]
    # Достижения игрока
    cur.execute(f"""
        SELECT a.*, pa.earned_at
        FROM {SCHEMA}.player_achievements pa
        JOIN {SCHEMA}.achievements a ON pa.achievement_id = a.id
        WHERE pa.player_id = %s
    """, (player_id,))
    achievements = [dict(r) for r in cur.fetchall()]
    conn.close()
    return ok({"player": dict(player), "costumes": costumes, "achievements": achievements})


def animals_list(params):
    player_id = params.get("player_id")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"SELECT * FROM {SCHEMA}.animals ORDER BY price ASC")
    animals = [dict(r) for r in cur.fetchall()]
    owned_ids = []
    if player_id:
        cur.execute(f"SELECT animal_id FROM {SCHEMA}.player_animals WHERE player_id = %s", (player_id,))
        owned_ids = [r["animal_id"] for r in cur.fetchall()]
    conn.close()
    for a in animals:
        a["owned"] = a["id"] in owned_ids
    return ok({"animals": animals})


def patterns_list(params):
    player_id = params.get("player_id")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"SELECT * FROM {SCHEMA}.patterns ORDER BY price ASC")
    patterns = [dict(r) for r in cur.fetchall()]
    owned_ids = []
    if player_id:
        cur.execute(f"SELECT pattern_id FROM {SCHEMA}.player_patterns WHERE player_id = %s", (player_id,))
        owned_ids = [r["pattern_id"] for r in cur.fetchall()]
    conn.close()
    for p in patterns:
        p["owned"] = p["id"] in owned_ids
    return ok({"patterns": patterns})


def costumes_list(params):
    player_id = params.get("player_id")
    if not player_id:
        return err("Нет player_id")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"""
        SELECT c.*, a.name as animal_name, a.emoji as animal_emoji, p.name as pattern_name, p.css_value as pattern_css
        FROM {SCHEMA}.costumes c
        JOIN {SCHEMA}.animals a ON c.animal_id = a.id
        JOIN {SCHEMA}.patterns p ON c.pattern_id = p.id
        WHERE c.player_id = %s ORDER BY c.created_at DESC
    """, (player_id,))
    costumes = [dict(r) for r in cur.fetchall()]
    conn.close()
    return ok({"costumes": costumes})


def costumes_create(body):
    player_id = body.get("player_id")
    animal_id = body.get("animal_id")
    pattern_id = body.get("pattern_id")
    name = body.get("name", "").strip()
    cloth_type = body.get("cloth_type", "")
    material = body.get("material", "")
    primary_color = body.get("primary_color", "#ff6b6b")
    secondary_color = body.get("secondary_color", "#ffffff")
    is_public = body.get("is_public", True)

    if not all([player_id, animal_id, pattern_id, name, cloth_type, material]):
        return err("Заполни все поля")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(f"SELECT id FROM {SCHEMA}.player_animals WHERE player_id = %s AND animal_id = %s", (player_id, animal_id))
    if not cur.fetchone():
        conn.close()
        return err("Это животное не куплено")

    cur.execute(f"SELECT id FROM {SCHEMA}.player_patterns WHERE player_id = %s AND pattern_id = %s", (player_id, pattern_id))
    if not cur.fetchone():
        conn.close()
        return err("Этот паттерн не куплен")

    cur.execute(f"""
        INSERT INTO {SCHEMA}.costumes (player_id, animal_id, name, cloth_type, material, pattern_id, primary_color, secondary_color, is_public)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
    """, (player_id, animal_id, name, cloth_type, material, pattern_id, primary_color, secondary_color, is_public))
    costume_id = cur.fetchone()["id"]

    # Начислить монеты за создание
    cur.execute(f"UPDATE {SCHEMA}.players SET coins = coins + 10 WHERE id = %s", (player_id,))

    # Проверяем достижения
    cur.execute(f"SELECT COUNT(*) as cnt FROM {SCHEMA}.costumes WHERE player_id = %s", (player_id,))
    count = cur.fetchone()["cnt"]
    _check_achievement(cur, player_id, "costumes_count", count)

    conn.commit()
    conn.close()
    return ok({"costume_id": costume_id, "coins_earned": 10})


def shop_buy(body):
    player_id = body.get("player_id")
    item_type = body.get("item_type")
    item_id = body.get("item_id")

    if not all([player_id, item_type, item_id]):
        return err("Неверные параметры")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(f"SELECT coins FROM {SCHEMA}.players WHERE id = %s", (player_id,))
    player = cur.fetchone()
    if not player:
        conn.close()
        return err("Игрок не найден")

    if item_type == "animal":
        cur.execute(f"SELECT price FROM {SCHEMA}.animals WHERE id = %s", (item_id,))
        item = cur.fetchone()
        if not item:
            conn.close()
            return err("Животное не найдено")
        if player["coins"] < item["price"]:
            conn.close()
            return err("Недостаточно монет")
        cur.execute(
            f"INSERT INTO {SCHEMA}.player_animals (player_id, animal_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (player_id, item_id)
        )
        cur.execute(f"UPDATE {SCHEMA}.players SET coins = coins - %s WHERE id = %s", (item["price"], player_id))
        # Достижение коллекционер
        cur.execute(f"SELECT COUNT(*) as cnt FROM {SCHEMA}.player_animals pa JOIN {SCHEMA}.animals a ON pa.animal_id = a.id WHERE pa.player_id = %s AND a.is_default = FALSE", (player_id,))
        count = cur.fetchone()["cnt"]
        _check_achievement(cur, player_id, "animals_count", count)

    elif item_type == "pattern":
        cur.execute(f"SELECT price FROM {SCHEMA}.patterns WHERE id = %s", (item_id,))
        item = cur.fetchone()
        if not item:
            conn.close()
            return err("Паттерн не найден")
        if player["coins"] < item["price"]:
            conn.close()
            return err("Недостаточно монет")
        cur.execute(
            f"INSERT INTO {SCHEMA}.player_patterns (player_id, pattern_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (player_id, item_id)
        )
        cur.execute(f"UPDATE {SCHEMA}.players SET coins = coins - %s WHERE id = %s", (item["price"], player_id))
        cur.execute(f"SELECT COUNT(*) as cnt FROM {SCHEMA}.player_patterns pa JOIN {SCHEMA}.patterns p ON pa.pattern_id = p.id WHERE pa.player_id = %s AND p.is_default = FALSE", (player_id,))
        count = cur.fetchone()["cnt"]
        _check_achievement(cur, player_id, "patterns_count", count)
    else:
        conn.close()
        return err("Неверный тип товара")

    cur.execute(f"SELECT coins FROM {SCHEMA}.players WHERE id = %s", (player_id,))
    new_coins = cur.fetchone()["coins"]
    _check_achievement(cur, player_id, "coins_total", new_coins)

    conn.commit()
    conn.close()
    return ok({"success": True, "coins_left": new_coins})


def achievements_list(params):
    player_id = params.get("player_id")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"SELECT * FROM {SCHEMA}.achievements ORDER BY id")
    all_ach = [dict(r) for r in cur.fetchall()]
    earned_ids = []
    if player_id:
        cur.execute(f"SELECT achievement_id FROM {SCHEMA}.player_achievements WHERE player_id = %s", (player_id,))
        earned_ids = [r["achievement_id"] for r in cur.fetchall()]
    conn.close()
    for a in all_ach:
        a["earned"] = a["id"] in earned_ids
    return ok({"achievements": all_ach})


def gallery_list(params):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"""
        SELECT c.*, a.name as animal_name, a.emoji as animal_emoji,
               p.name as pattern_name, p.css_value as pattern_css,
               pl.nickname as player_name
        FROM {SCHEMA}.costumes c
        JOIN {SCHEMA}.animals a ON c.animal_id = a.id
        JOIN {SCHEMA}.patterns p ON c.pattern_id = p.id
        JOIN {SCHEMA}.players pl ON c.player_id = pl.id
        WHERE c.is_public = TRUE
        ORDER BY c.created_at DESC LIMIT 50
    """)
    costumes = [dict(r) for r in cur.fetchall()]
    conn.close()
    return ok({"costumes": costumes})


def leaderboard_get():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"""
        SELECT p.id, p.nickname, p.coins,
               COUNT(c.id) as costumes_count,
               COUNT(pa.id) as achievements_count
        FROM {SCHEMA}.players p
        LEFT JOIN {SCHEMA}.costumes c ON c.player_id = p.id
        LEFT JOIN {SCHEMA}.player_achievements pa ON pa.player_id = p.id
        GROUP BY p.id, p.nickname, p.coins
        ORDER BY p.coins DESC LIMIT 50
    """)
    leaders = [dict(r) for r in cur.fetchall()]
    conn.close()
    return ok({"leaders": leaders})


def _check_achievement(cur, player_id, condition_type, current_value):
    cur.execute(
        f"SELECT id, reward_coins FROM {SCHEMA}.achievements WHERE condition_type = %s AND condition_value <= %s",
        (condition_type, current_value)
    )
    for ach in cur.fetchall():
        cur.execute(
            f"SELECT id FROM {SCHEMA}.player_achievements WHERE player_id = %s AND achievement_id = %s",
            (player_id, ach["id"])
        )
        if not cur.fetchone():
            cur.execute(
                f"INSERT INTO {SCHEMA}.player_achievements (player_id, achievement_id) VALUES (%s, %s)",
                (player_id, ach["id"])
            )
            cur.execute(
                f"UPDATE {SCHEMA}.players SET coins = coins + %s WHERE id = %s",
                (ach["reward_coins"], player_id)
            )