/**
 * Valores lidos de variaveis de ambiente do Expo (ficheiro .env local, nunca no git).
 * Ver .env.example para os nomes.
 */
export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const MAPBOX_ACCESS_TOKEN: string = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
