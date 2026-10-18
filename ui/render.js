import {
  formatPokemonName,
  getTypeLabel
} from '../utils/pokemon.js';

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

export function renderPokemonCards(pokemonList, gridElement) {
  const fragment = document.createDocumentFragment();

  pokemonList.forEach((pokemon) => {
    const card = makeElement('article', 'pokemon-card');

    // Número de la Pokédex
    const topLine = makeElement('div', 'pokemon-card__top');

    topLine.append(
      makeElement(
        'span',
        'pokemon-number',
        `#${String(pokemon.id).padStart(3, '0')}`
      )
    );

    card.append(topLine);

    // Imagen
    const imageFrame = makeElement(
      'div',
      'pokemon-card__image-frame'
    );

    if (pokemon.image) {
      const image = makeElement('img', 'pokemon-card__image');

      image.src = pokemon.image;
      image.alt = `Ilustración de ${formatPokemonName(pokemon.name)}`;
      image.loading = 'lazy';

      image.addEventListener('error', () => {
        image.remove();

        imageFrame.append(
          makeElement(
            'span',
            'image-fallback',
            'Imagen no disponible'
          )
        );
      }, { once: true });

      imageFrame.append(image);
    } else {
      imageFrame.append(
        makeElement(
          'span',
          'image-fallback',
          'Imagen no disponible'
        )
      );
    }

    card.append(imageFrame);

    // Nombre
    card.append(
      makeElement(
        'h2',
        'pokemon-card__name',
        formatPokemonName(pokemon.name)
      )
    );

    // Tipos
    const types = makeElement('div', 'pokemon-card__types');

    pokemon.types.forEach((type) => {
      types.append(
        makeElement(
          'span',
          `type-badge type-${type}`,
          getTypeLabel(type)
        )
      );
    });

    card.append(types);

    // Estadísticas
    const stats = makeElement('dl', 'pokemon-card__stats');

    [
      ['HP', pokemon.hp],
      ['Ataque', pokemon.attack],
      ['Defensa', pokemon.defense],
      ['Velocidad', pokemon.speed]
    ].forEach(([label, value]) => {
      const item = makeElement('div', 'stat-item');

      item.append(
        makeElement('dt', '', label),
        makeElement('dd', '', String(value))
      );

      stats.append(item);
    });

    card.append(stats);

    card.append(
      makeElement(
        'p',
        'pokemon-card__dimensions',
        `${pokemon.height} m · ${pokemon.weight} kg`
      )
    );

    fragment.append(card);
  });

  gridElement.replaceChildren(fragment);
}