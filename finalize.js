const { gzip } = require('@gfx/zopfli');
var brotli = require('brotli');
const FS = require('fs');
const path = require('path');

const BUNDLE_JS = FS.readFileSync(
  path.resolve(__dirname, './dist/spa/assets/index.js')
);

const HTML = `
<!DOCTYPE html>
<html lang=en>
<head>
    <meta charset=utf-8>
    <meta http-equiv=X-UA-Compatible content="IE=edge">
    <meta name=viewport content="width=device-width,initial-scale=1">
    <link rel=icon href=/favicon.ico> <title>BraiaDash</title>
</head>
<body>
    <noscript>
        <strong>Para que o dashboard funcione corretamente é necessário ativar o JavaScript.</strong>
    </noscript>
    <div id=q-app></div>
    <script defer>${BUNDLE_JS}</script>
</body>
</html>
`;

function chunkArray(myArray, chunk_size) {
  let index = 0;
  const arrayLength = myArray.length;
  const tempArray = [];
  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = myArray.slice(index, index + chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }
  return tempArray;
}

function addLineBreaks(buffer) {
  let data = '';
  const chunks = chunkArray(buffer, 30);
  chunks.forEach((chunk, index) => {
    data += chunk.join(',');
    if (index + 1 !== chunks.length) {
      data += ',\n';
    }
  });
  return data;
}

FS.writeFileSync(path.resolve(__dirname, './dist/webpage.html'), HTML);

var output = brotli.compress(HTML, {
  mode: 0,
  quality: 11,
});

console.log('Gravando webpage.html...');

FS.writeFileSync(path.resolve(__dirname, './dist/webpage.brotli.html'), output);

const FILE = `#ifndef DashWebpage_h
#define DashWebpage_h
const uint32_t DASH_HTML_SIZE = ${output.length};
const uint8_t DASH_HTML[] PROGMEM = {
${addLineBreaks(output)}
};
#endif
`;
console.log('Gravando webpage.h...');

FS.writeFileSync(path.resolve(__dirname, './dist/webpage.brotli.h'), FILE);

console.log(
  `[COMPRESS] Arquivos de build compactados para webpage.h: ${(
    output.length / 1024
  ).toFixed(2)}KB`
);

gzip(HTML, { numiterations: 15 }, (err, output) => {
  if (err) {
    return console.error(err);
  }

  console.log('Gravando webpage.html...');

  FS.writeFileSync(
    path.resolve(__dirname, './dist/webpage.zopfli.html'),
    output
  );

  const FILE = `#ifndef DashWebpage_h
#define DashWebpage_h
const uint32_t DASH_HTML_SIZE = ${output.length};
const uint8_t DASH_HTML[] PROGMEM = {
${addLineBreaks(output)}
};
#endif
`;
  console.log('Gravando webpage.h...');

  FS.writeFileSync(path.resolve(__dirname, './dist/webpage.zopfli.h'), FILE);

  console.log(
    `[COMPRESS] Arquivos de build compactados para webpage.h: ${(
      output.length / 1024
    ).toFixed(2)}KB`
  );
});
