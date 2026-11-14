/**
 * CONSTANTES CENTRAIS DO MUNDO (única fonte de verdade)
 * Mapa 96x64 tiles de 32px = 3072 x 2048 px.
 */
export const TILE_SIZE = 32;
export const MAP_COLS = 96;
export const MAP_ROWS = 64;
export const WORLD_W = MAP_COLS * TILE_SIZE; // 3072
export const WORLD_H = MAP_ROWS * TILE_SIZE; // 2048

/** Resolução da grade de colisão (meio tile = 16px) */
export const COLLISION_CELL = TILE_SIZE / 2;
export const COLLISION_COLS = MAP_COLS * 2;
export const COLLISION_ROWS = MAP_ROWS * 2;

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;

/** Os bots andavam em um mundo ~2.5x menor; esta escala mantém o ritmo parecido. */
export const BOT_SPEED_SCALE = 1.7;

export const tilesParaPx = (t: number): number => Math.round(t * TILE_SIZE);
