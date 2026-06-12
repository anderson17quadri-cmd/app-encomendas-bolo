const fs = require('fs');
const path = 'app/new-order.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /const deliveryDate = `\$\$\{ano[^`]+`/,
  'const deliveryDate = `$${ano.padStart(4,\'0\')}-$${mes.padStart(2,\'0\')}-${dia.padStart(2,\'0\')}`;'
);
fs.writeFileSync(path, content);
console.log('Corrigido!');
