const API_BASE = 'https://pokeapi.co/api/v2/pokemon';

const CACHE_PREFIX = 'pokedex-cache:';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

function readCache(url) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${url}`);

    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);

    if (!cached || Date.now() - cached.savedAt > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_PREFIX}${url}`);
      return null;
    }

    return cached.data ?? null;
  } catch {
    // Si la caché falla, seguimos sin ella.
    return null;
  }
}

function writeCache(url, data) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${url}`,
      JSON.stringify({
        savedAt: Date.now(),
        data
      })
    );
  } catch {
    // Si no se puede guardar, la aplicación sigue funcionando.
  }
}

export async function fetchJson(url) {
  const cachedData = readCache(url);

  if (cachedData !== null) {
    return cachedData;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`La API respondió con HTTP ${response.status}.`);
  }

  const data = await response.json();

  writeCache(url, data);

  return data;
}

export async function getPokemonPage(limit = 24, offset = 0) {
  return fetchJson(
    `${API_BASE}?limit=${limit}&offset=${offset}`
  );
}

export async function getPokemonDetails(nameOrUrl) {
  const url = nameOrUrl.startsWith('http')
    ? nameOrUrl
    : `${API_BASE}/${encodeURIComponent(nameOrUrl.toLowerCase())}`;

  return fetchJson(url);
}