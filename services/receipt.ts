import { Order } from '../constants/types';
import { Platform } from 'react-native';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr?.split?.('-');
  if (parts?.length !== 3) return dateStr ?? '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const SALGADOS_LABELS: Record<string, string> = {
  coxinha: 'Coxinha',
  rissoisCarne: 'Rissois Carne',
  rissoisMistos: 'Rissois Mistos',
  bolinhsQueijo: 'Bol. Queijo',
  pastelFrango: 'Pastel Frango',
  pastelCarne: 'Pastel Carne',
  pastelPizza: 'Pastel Pizza',
  enroladinho: 'Enroladinho',
  pastelBacalhau: 'Past. Bacalhau',
};

const BRIGADEIROS_LABELS: Record<string, string> = {
  tradicional: 'Tradicional', beijinho: 'Beijinho',
  morango: 'Morango', ninho: 'Ninho',
  churros: 'Churros', sensacao: 'Sensacao',
  seducao: 'Seducao', casadinho: 'Casadinho',
  prestigio: 'Prestigio', oreo: 'Oreo',
  napolitano: 'Napolitano', cafe: 'Cafe',
};

function campo(label: string, valor: string): string {
  if (!valor || valor.trim() === '') return '';
  return `${label}: ${valor}\n`;
}

function sep(char = '-', n = 32): string {
  return char.repeat(n) + '\n';
}

function generateReceiptText(order: Order | null | undefined): string {
  if (!order) return 'Encomenda nao encontrada';

  const tipo = order.orderType ?? 'bolo';
  let txt = '';

  txt += '         SAL DOCE\n';
  txt += '   Encomendas & Docinhos\n';
  txt += sep('=');

  txt += campo('Nome', order.clientName ?? '');
  txt += campo('Telemovel', order.clientPhone ?? '');

  if (order.sourceChannel === 'Instagram') {
    txt += campo('Instagram', order.clientPhone ?? '');
  } else if (order.sourceChannel === 'WhatsApp') {
    txt += campo('WhatsApp', order.clientPhone ?? '');
  }

  txt += campo('Entrega', formatDate(order.deliveryDate));
  txt += sep();

  if (tipo === 'bolo') {
    txt += 'Bolo de Aniversario\n';
    txt += campo('Massa', order.cakeType ?? '');
    txt += campo('Recheio', order.filling ?? '');
    if (order.weightKg > 0) txt += campo('Peso', `${String(order.weightKg).replace('.', ',')} kg`);
    if (order.topper && order.topper !== 'Sem topper') txt += campo('Decoracao', order.topper);
    if (order.hostia) txt += campo('Descricao', order.hostia);
  } else if (tipo === 'salgados') {
    txt += 'Salgados\n';
    const s = (order.salgados ?? {}) as Record<string, number>;
    Object.entries(s).filter(([, qty]) => qty > 0).forEach(([key, qty]) => {
      txt += campo(SALGADOS_LABELS[key] ?? key, `x${qty}`);
    });
  } else if (tipo === 'brigadeiros') {
    txt += 'Brigadeiros\n';
    const b = (order.brigadeiros ?? {}) as Record<string, number>;
    Object.entries(b).filter(([, qty]) => qty > 0).forEach(([key, qty]) => {
      txt += campo(BRIGADEIROS_LABELS[key] ?? key, `x${qty}`);
    });
  } else if (tipo === 'especial') {
    txt += 'Especial\n';
    txt += `${order.especial ?? ''}\n`;
  }

  txt += sep();
  if (order.price) txt += campo('Preco', `€ ${order.price.toFixed(2).replace('.', ',')}`);
  if (order.notes) txt += campo('Observacao', order.notes);
  txt += sep('=');
  txt += '  Obrigado pela preferencia!\n';
  txt += `  ${new Date().toLocaleDateString('pt-PT')}\n`;

  return txt;
}

export function generateReceiptHTML(order: Order | null | undefined): string {
  const text = generateReceiptText(order);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    width: 58mm;
    padding: 4mm 3mm;
    background: white;
    color: black;
    line-height: 1.6;
  }
  pre { white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>
<pre>${text}</pre>
</body>
</html>`;
}

export async function printReceipt(order: Order | null | undefined): Promise<void> {
  const html = generateReceiptHTML(order);
  if (Platform.OS === 'web') {
    const w = window?.open?.('', '_blank');
    if (w) { w.document?.write?.(html); w.document?.close?.(); w?.print?.(); }
    return;
  }
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');
  try {
    const { uri } = await Print.printToFileAsync({ html });
    const ok = await Sharing.isAvailableAsync();
    if (ok) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Partilhar recibo' });
  } catch (e) { console.error('Error printing receipt:', e); }
}

export async function printDirect(order: Order | null | undefined): Promise<void> {
  const html = generateReceiptHTML(order);
  if (typeof window !== 'undefined') {
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    return;
  }
  const Print = await import('expo-print');
  try { await Print.printAsync({ html }); } catch (e) { console.error(e); }
}
