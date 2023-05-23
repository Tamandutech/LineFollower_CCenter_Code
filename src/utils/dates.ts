export function timeDistance(date: Date, locale = 'pt') {
  const now = new Date();
  const distance = date - now;

  // Format the distance as a relative time string
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const hours = Math.floor(distance / 3600000); // 1 hour = 3600000 milliseconds
  const minutes = Math.floor((distance % 3600000) / 60000); // 1 minute = 60000 milliseconds
  const relativeTime = formatter.format(hours * 60 + minutes, 'minute');

  return `${relativeTime}`;
}
