import { Order } from '../constants/types';
import { Platform } from 'react-native';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr?.split?.('-');
  if (parts?.length !== 3) return dateStr ?? '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatWeight(w: number | null | undefined): string {
  if (w == null) return '0';
  return String(w).replace('.', ',');
}

function getStatusLabel(status: string | null | undefined): string {
  return status ?? 'Desconhecido';
}

export function generateReceiptHTML(order: Order | null | undefined): string {
  if (!order) return '<html><body><p>Encomenda não encontrada</p></body></html>';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #FFF8F5; color: #3E2723; padding: 24px; }
    .header { background: linear-gradient(135deg, #E91E63, #FF6F61); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #FCE4EC; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #FCE4EC; }
    .row:last-child { border-bottom: none; }
    .label { color: #795548; font-size: 14px; }
    .value { font-weight: 600; font-size: 14px; text-align: right; }
    .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; }
    .notes { background: #FCE4EC; padding: 16px; border-radius: 12px; margin-top: 16px; }
    .notes-label { font-size: 13px; color: #795548; margin-bottom: 4px; }
    .notes-text { font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; color: #795548; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎂 Encomenda de Bolo</h1>
    <p>Pedido criado em ${formatDate(order?.createdAt?.substring?.(0, 10))}</p>
  </div>
  <div class="card">
    <div class="row"><span class="label">Cliente</span><span class="value">${order?.clientName ?? ''}</span></div>
    <div class="row"><span class="label">Canal de Origem</span><span class="value">${order?.sourceChannel ?? ''}</span></div>
    <div class="row"><span class="label">Data de Entrega</span><span class="value">${formatDate(order?.deliveryDate)}</span></div>
    <div class="row"><span class="label">Tipo de Massa</span><span class="value">${order?.cakeType ?? ''}</span></div>
    <div class="row"><span class="label">Recheio</span><span class="value">${order?.filling ?? ''}</span></div>
    <div class="row"><span class="label">Peso</span><span class="value">${formatWeight(order?.weightKg)} kg</span></div>
    <div class="row"><span class="label">Status</span><span class="value">${getStatusLabel(order?.status)}</span></div>
  </div>
  ${order?.notes ? `<div class="notes"><div class="notes-label">Observações</div><div class="notes-text">${order.notes}</div></div>` : ''}
  <div class="footer">Gerado pelo app Encomendas de Bolo</div>
</body>
</html>`;
}

export async function printReceipt(order: Order | null | undefined): Promise<void> {
  const html = generateReceiptHTML(order);
  if (Platform.OS === 'web') {
    const printWindow = window?.open?.('', '_blank');
    if (printWindow) {
      printWindow.document?.write?.(html);
      printWindow.document?.close?.();
      printWindow?.print?.();
    }
    return;
  }
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');
  try {
    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar recibo' });
    }
  } catch (e) {
    console.error('Error printing receipt:', e);
  }
}

export async function printDirect(order) {
  const html = generateReceiptHTML(order);
  if (typeof window !== 'undefined') {
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    return;
  }
  const Print = await import('expo-print');
  try { await Print.printAsync({ html }); } catch (e) { console.error(e); }
}
