const { createClient } = require('@supabase/supabase-js');
const appJson = require('./app.json');
const url = appJson.expo.extra.supabaseUrl;
const key = appJson.expo.extra.supabaseAnonKey;
const supabase = createClient(url, key);

async function run() {
  const result = await supabase.from('orders').select('client_name, client_phone, source_channel');
  const orders = result.data;
  console.log('Encomendas:', orders ? orders.length : 0);
  if (!orders || orders.length === 0) return;

  const unique = {};
  for (const o of orders) {
    if (!o.client_name) continue;
    const k = o.client_name.toLowerCase().trim();
    if (!unique[k]) unique[k] = { name: o.client_name.trim(), phone: o.client_phone, source_channel: o.source_channel };
  }

  const clients = Object.values(unique);
  console.log('Clientes unicos:', clients.length);

  for (const c of clients) {
    const r = await supabase.from('clients').upsert(c, { onConflict: 'name' });
    if (r.error) console.error('Erro:', c.name, r.error.message);
    else console.log('OK:', c.name);
  }
}
run();
