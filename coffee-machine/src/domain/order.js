const { DRINKS, MAX_SUGARS } = require('./drinks');
const { ValidationError } = require('./errors');

function normalizeOrder({ drink, sugars = 0, extraHot = false, money = 0 } = {}) {
  if (!Object.hasOwn(DRINKS, drink)) {
    throw new ValidationError(`Unknown drink: ${drink}`);
  }
  const definition = DRINKS[drink];
  if (!Number.isInteger(sugars) || sugars < 0 || sugars > MAX_SUGARS) {
    throw new ValidationError(`Sugars must be an integer between 0 and ${MAX_SUGARS}`);
  }
  if (sugars > 0 && !definition.supportsSugar) {
    throw new ValidationError(`${drink} cannot be served with sugar`);
  }
  if (typeof extraHot !== 'boolean') {
    throw new ValidationError('extraHot must be a boolean');
  }
  if (extraHot && !definition.supportsExtraHot) {
    throw new ValidationError(`${drink} cannot be served extra hot`);
  }
  if (typeof money !== 'number' || !Number.isFinite(money) || money < 0) {
    throw new ValidationError('money must be a positive number (euros)');
  }

  return { drink, sugars, extraHot, moneyCents: Math.round(money * 100) };
}

// "T:1:0" = tea, 1 sugar, 1 stick  |  "Hh::" = extra hot chocolate, no sugar, no stick
function toCommand({ drink, sugars, extraHot }) {
  const code = DRINKS[drink].code + (extraHot ? 'h' : '');
  const sugarPart = sugars > 0 ? String(sugars) : '';
  const stickPart = sugars > 0 ? '0' : '';
  return `${code}:${sugarPart}:${stickPart}`;
}

module.exports = { normalizeOrder, toCommand };
