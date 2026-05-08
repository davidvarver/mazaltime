export function getRaffleWatchTitle(raffle) {
  if (!raffle) return '';

  const brand = raffle.watchBrand?.trim();
  const model = raffle.watchModel?.trim();
  const composedTitle = [brand, model].filter(Boolean).join(' ').trim();

  return composedTitle || raffle.watchName || raffle.title || 'Rifa Mazal Time';
}

export function composeWatchName({ watchBrand, watchModel, watchName }) {
  const composedTitle = [watchBrand, watchModel]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return composedTitle || String(watchName || '').trim();
}
