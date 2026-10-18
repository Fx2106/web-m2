const TYPE_LABELS = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada',
  stellar: 'Estelar',
  unknown: 'Desconocido',
  shadow: 'Sombra'
};

export function normalizePokemon(pokemon) {
  const stats = pokemon.stats.reduce((result, entry) => {
    result[entry.stat.name] = entry.base_stat;
    return result;
  }, {});

  return {
    id: pokemon.id,
    name: pokemon.name,

    image:
      pokemon.sprites?.other?.['official-artwork']?.front_default
      ?? pokemon.sprites?.front_default
      ?? '',

    types: pokemon.types.map((entry) => entry.type.name),

    hp: stats.hp ?? 0,
    attack: stats.attack ?? 0,
    defense: stats.defense ?? 0,
    speed: stats.speed ?? 0,

    height: pokemon.height / 10,
    weight: pokemon.weight / 10
  };
}

export function getTypeLabel(type) {
  return TYPE_LABELS[type]
    ?? type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatPokemonName(name) {
  return name
    .replaceAll('-', ' ')
    .split(' ')
    .map((part) => (
      part.charAt(0).toUpperCase() + part.slice(1)
    ))
    .join(' ');
}