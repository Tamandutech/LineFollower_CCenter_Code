const colors = [
  'red',
  'pink',
  'purple',
  'deep-purple',
  'indigo',
  'blue',
  'light-blue',
  'cyan',
  'teal',
  'green',
  'light-green',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deep-orange',
  'brown',
  'grey',
];

export const getRandomColor = function () {
  return colors[Math.floor(Math.random() * colors.length)];
};

export const randomColorGenerator = function* () {
  const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

  let i = 0;
  while (true) {
    if (i == shuffledColors.length) i = 0;

    yield shuffledColors[i];
    i += 1;
  }
};
