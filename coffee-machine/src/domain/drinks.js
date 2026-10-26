// Prices are stored in cents to avoid floating point errors (0.1 + 0.2 !== 0.3).
const DRINKS = Object.freeze({
  tea: { code: 'T', priceCents: 40, supportsSugar: true, supportsExtraHot: true },
  coffee: { code: 'C', priceCents: 60, supportsSugar: true, supportsExtraHot: true },
  chocolate: { code: 'H', priceCents: 50, supportsSugar: true, supportsExtraHot: true },
  orange: { code: 'O', priceCents: 60, supportsSugar: false, supportsExtraHot: false },
});

const MAX_SUGARS = 2;

const formatEuros = (cents) => (cents / 100).toFixed(2);

module.exports = { DRINKS, MAX_SUGARS, formatEuros };
