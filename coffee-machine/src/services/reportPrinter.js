const { formatEuros } = require('../domain/drinks');

function formatReport({ drinks, totalCents }) {
  const lines = ['--- Coffee machine report ---'];
  for (const [name, { count }] of Object.entries(drinks)) {
    lines.push(`${name}: ${count}`);
  }
  lines.push(`Total earned: ${formatEuros(totalCents)} euro`);
  return lines.join('\n');
}

module.exports = { formatReport };
