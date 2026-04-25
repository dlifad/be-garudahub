# Implementasi ID Stabil Lintas Environment

Implementasi sudah dijalankan dengan pendekatan `player_code` sebagai identifier stabil.

## Perubahan Utama

1. `database/data/players.json`
- Semua pemain sekarang memiliki field `player_code` (slug stabil), contoh:

```json
{
  "name": "Rafael William Struick",
  "player_code": "rafael-william-struick"
}
```

2. `database/data/tournament_players.json`
- Format relasi diubah dari `tournament_id + player_id` menjadi:

```json
{
  "tournament_id": 1,
  "player_code": "rafael-william-struick"
}
```

3. `database/seed.js`
- Menambahkan generator `player_code` fallback (jika ada data pemain lama tanpa kode).
- Menambahkan bootstrap schema agar kolom `players.player_code` tersedia di DB lama.
- Seeder `tournament_players` sekarang prioritas resolusi:
  - `player_code` (utama)
  - `player_id` (legacy)
  - `player_name` (legacy)

4. `database/init.sql`
- Menambahkan kolom `player_code` pada tabel `players`.
- Menambahkan unique index `idx_players_code_unique`.

## Hasil Verifikasi

- `players.json` memiliki `player_code` unik untuk seluruh pemain.
- `tournament_players.json` seluruh entri valid terhadap `player_code` pemain.
- `seed.js` valid secara sintaks (`node --check`).
- Saat menjalankan seed, error terkait `player_code` hilang.

## Catatan Operasional

- Menjalankan `node database/seed.js` pada DB yang sudah berisi data `matches` masih bisa memicu constraint:
  - `UNIQUE constraint failed: matches.tournament_id, matches.match_date_utc`
- Ini bukan regresi dari perubahan `player_code`, melainkan karena seeder `matches` masih mode insert biasa (belum upsert).
