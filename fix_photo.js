const fs = require('fs');
let c = fs.readFileSync('app/new-order.tsx', 'utf8');
if (!c.includes('photoStorage')) {
  c = c.replace(
    "import * as ImagePicker from 'expo-image-picker';",
    "import * as ImagePicker from 'expo-image-picker';\nimport { photoToBase64 } from '../services/photoStorage';"
  );
}
c = c.replace(
  'photoUri: form.photoUri,',
  'photoUri: form.photoUri ? (await photoToBase64(form.photoUri) ?? null) : null,'
);
fs.writeFileSync('app/new-order.tsx', c);
console.log('ok');
