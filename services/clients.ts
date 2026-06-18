import { supabase } from './supabase';

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  sourceChannel: string;
  notes: string | null;
  createdAt: string;
}

function fromRow(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string | null,
    sourceChannel: (row.source_channel as string) ?? 'WhatsApp',
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

export async function getAllClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });
  if (error) { console.error('getAllClients error:', error); return []; }
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

export async function searchClients(query: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', `%${query.trim()}%`)
    .order('name', { ascending: true });
  if (error) { console.error('searchClients error:', error); return []; }
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

export async function upsertClient(name: string, phone: string | null, sourceChannel: string): Promise<Client | null> {
  // Verifica se já existe cliente com mesmo nome
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', name.trim())
    .single();

  if (existing) {
    // Atualiza telefone se mudou
    const { data, error } = await supabase
      .from('clients')
      .update({ phone, source_channel: sourceChannel, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return null;
    return fromRow(data as Record<string, unknown>);
  }

  // Cria novo cliente
  const { data, error } = await supabase
    .from('clients')
    .insert({ name: name.trim(), phone, source_channel: sourceChannel })
    .select()
    .single();
  if (error) { console.error('upsertClient error:', error); return null; }
  return fromRow(data as Record<string, unknown>);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) console.error('deleteClient error:', error);
}
