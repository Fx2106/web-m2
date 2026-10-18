import './style.css';

import {
  getPokemonDetails,
  getPokemonPage
} from './api/pokemonApi.js';

import {
  getTypeLabel,
  normalizePokemon
} from './utils/pokemon.js';

import {
  renderPokemonCards
} from './ui/render.js';

const PAGE_SIZE = 24;

const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const typeFilter = document.querySelector('#type-filter');

const resultsSummary = document.querySelector('#results-summary');
const attackAverage = document.querySelector('#attack-average');
const statusMessage = document.querySelector('#status-message');

const pokemonGrid = document.querySelector('#pokemon-grid');
const loadMoreButton = document.querySelector('#load-more');
const retryButton = document.querySelector('#retry-button');

// Estado de la aplicación
let allPokemon = [];
let offset = 0;
let isLoading = false;
let hasMore = true;

// Mensajes de estado
function setStatus(message, kind = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-message--${kind}`;
}

// Actualizar el selector de tipos
function updateTypeOptions() {
  const selectedType = typeFilter.value;

  const types = [
    ...new Set(
      allPokemon.flatMap((pokemon) => pokemon.types)
    )
  ].sort();

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'Todos los tipos';

  const typeOptions = types.map((type) => {
    const option = document.createElement('option');

    option.value = type;
    option.textContent = getTypeLabel(type);

    return option;
  });

  typeFilter.replaceChildren(allOption, ...typeOptions);

  typeFilter.value = types.includes(selectedType)
    ? selectedType
    : 'all';
}

// Buscar, filtrar y actualizar las tarjetas
function renderCurrentResults() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedType = typeFilter.value;

  const filteredPokemon = allPokemon.filter((pokemon) => {
    const matchesSearch =
      pokemon.name.includes(term)
      || String(pokemon.id).includes(term);

    const matchesType =
      selectedType === 'all'
      || pokemon.types.includes(selectedType);

    return matchesSearch && matchesType;
  });

  renderPokemonCards(filteredPokemon, pokemonGrid);

  resultsSummary.textContent =
    `${filteredPokemon.length} resultados · `
    + `${allPokemon.length} Pokémon cargados`;

  if (filteredPokemon.length === 0) {
    attackAverage.textContent = 'Ataque medio: —';

    setStatus(
      allPokemon.length === 0
        ? 'Todavía no hay datos. Comprueba la conexión y reintenta.'
        : 'No hay resultados con esa búsqueda y esos filtros. '
          + 'Prueba otros criterios o carga más Pokémon.',
      'empty'
    );

    return;
  }

  // Calcular el ataque medio de los resultados visibles
  const totalAttack = filteredPokemon.reduce(
    (total, pokemon) => total + pokemon.attack,
    0
  );

  const averageAttack = Math.round(
    totalAttack / filteredPokemon.length
  );

  attackAverage.textContent = `Ataque medio: ${averageAttack}`;

  setStatus(
    `Mostrando ${filteredPokemon.length} Pokémon. `
    + 'Puedes buscar por nombre o número.',
    'success'
  );
}

// Activar y desactivar controles según el estado de carga
function updateControls() {
  searchInput.disabled = isLoading;
  typeFilter.disabled = isLoading;

  loadMoreButton.disabled = isLoading || !hasMore;

  loadMoreButton.hidden =
    allPokemon.length === 0 || !hasMore;

  pokemonGrid.setAttribute(
    'aria-busy',
    String(isLoading)
  );
}

// Consultar una página de Pokémon
async function loadPokemon({ reset = false } = {}) {
  if (isLoading || (!hasMore && !reset)) {
    return;
  }

  if (reset) {
    allPokemon = [];
    offset = 0;
    hasMore = true;

    searchInput.value = '';
    typeFilter.value = 'all';

    renderPokemonCards([], pokemonGrid);

    resultsSummary.textContent = 'Cargando Pokémon...';
    attackAverage.textContent = 'Ataque medio: —';
  }

  isLoading = true;

  retryButton.hidden = true;
  loadMoreButton.disabled = true;

  setStatus(
    'Consultando PokeAPI... Esto puede tardar unos segundos.',
    'loading'
  );

  updateControls();

  try {
    const page = await getPokemonPage(PAGE_SIZE, offset);

    if (!Array.isArray(page.results)) {
      throw new Error(
        'La respuesta de la API no tiene el formato esperado.'
      );
    }

    if (page.results.length === 0) {
      hasMore = false;
      setStatus('No hay más Pokémon para cargar.', 'info');
      return;
    }

    // Pedir los detalles individuales sin detener toda la carga
    // si falla uno de ellos.
    const outcomes = await Promise.allSettled(
      page.results.map((entry) => getPokemonDetails(entry.url))
    );

    const loadedPokemon = outcomes
      .filter((outcome) => outcome.status === 'fulfilled')
      .map((outcome) => normalizePokemon(outcome.value));

    const failedCount = outcomes.length - loadedPokemon.length;

    if (loadedPokemon.length === 0) {
      throw new Error(
        'No se pudieron cargar los detalles de los Pokémon.'
      );
    }

    const knownIds = new Set(
      allPokemon.map((pokemon) => pokemon.id)
    );

    allPokemon.push(
      ...loadedPokemon.filter(
        (pokemon) => !knownIds.has(pokemon.id)
      )
    );

    offset += page.results.length;
    hasMore = Boolean(page.next);

    updateTypeOptions();
    renderCurrentResults();

    if (failedCount > 0) {
      setStatus(
        `Se cargaron los resultados disponibles, pero fallaron `
        + `${failedCount} detalles. Puedes reintentar la carga completa.`,
        'warning'
      );

      retryButton.hidden = false;
    }
  } catch (error) {
    const detail = error instanceof Error
      ? error.message
      : 'Error desconocido.';

    setStatus(
      'No se pudieron cargar los Pokémon. '
      + `Comprueba la conexión e inténtalo otra vez. ${detail}`,
      'error'
    );

    retryButton.hidden = false;
  } finally {
    isLoading = false;
    updateControls();
  }
}

// Eventos
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderCurrentResults();
});

searchInput.addEventListener(
  'input',
  renderCurrentResults
);

typeFilter.addEventListener(
  'change',
  renderCurrentResults
);

loadMoreButton.addEventListener('click', () => {
  loadPokemon();
});

retryButton.addEventListener('click', () => {
  loadPokemon({ reset: true });
});

// Primera carga
loadPokemon();