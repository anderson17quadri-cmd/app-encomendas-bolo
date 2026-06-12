const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://nkwhqrgsfytsohnmhhch.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2hxcmdzZnl0c29obm1oaGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTE2ODMsImV4cCI6MjA5Njc4NzY4M30.YUyJ23_wlZcSwHtKi-Gqf4QuuMOHbFTE0SAUX1Xo9e0');
s.from('orders').insert({
  id: 'test-456',
  client_name: 'Teste',
  client_phone: null,
  delivery_date: '2026-06-20',
  cake_type: 'Chocolate',
  filling: 'Brigadeiro',
  weight_kg: 2.0,
  photo_uri: null,
  source_channel: 'WhatsApp',
  notes: null,
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}).then(r => console.log(JSON.stringify(r)));
