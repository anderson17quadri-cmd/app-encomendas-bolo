import { Order } from '../constants/types';
import { Platform } from 'react-native';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr?.split?.('-');
  if (parts?.length !== 3) return dateStr ?? '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function linha(label: string, valor: string, largura = 32): string {
  const espaco = largura - label.length - valor.length;
  if (espaco <= 0) return `${label}: ${valor}\n`;
  return `${label}${' '.repeat(espaco)}${valor}\n`;
}

function separador(char = '-', largura = 32): string {
  return char.repeat(largura) + '\n';
}

function getSalgadosText(salgados: Record<string, number>): string {
  const LABELS: Record<string, string> = {
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
  return Object.entries(salgados)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => linha(LABELS[key] ?? key, `x${qty}`))
    .join('');
}

function getBrigadeirosText(brigadeiros: Record<string, number>): string {
  const LABELS: Record<string, string> = {
    tradicional: 'Tradicional',
    beijinho: 'Beijinho',
    morango: 'Morango',
    ninho: 'Ninho',
    churros: 'Churros',
    sensacao: 'Sensacao',
    seducao: 'Seducao',
    casadinho: 'Casadinho',
    prestigio: 'Prestigio',
    oreo: 'Oreo',
    napolitano: 'Napolitano',
    cafe: 'Cafe',
  };
  return Object.entries(brigadeiros)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => linha(LABELS[key] ?? key, `x${qty}`))
    .join('');
}

function generateReceiptText(order: Order | null | undefined): string {
  if (!order) return 'Encomenda nao encontrada';

  const tipo = order.orderType ?? 'bolo';
  const salgados = (order.salgados ?? {}) as Record<string, number>;
  const brigadeiros = (order.brigadeiros ?? {}) as Record<string, number>;

  let txt = '';
  txt += '       SAL DOCE\n';
  txt += '  Encomendas & Docinhos\n';
  txt += separador('=');
  txt += linha('Cliente', order.clientName ?? '');
  txt += linha('Canal', order.sourceChannel ?? '');
  txt += linha('Entrega', formatDate(order.deliveryDate));
  txt += separador();

  if (tipo === 'bolo') {
    txt += 'BOLO\n';
    txt += linha('Massa', order.cakeType ?? '');
    txt += linha('Recheio', order.filling ?? '');
    txt += linha('Peso', `${String(order.weightKg ?? 0).replace('.', ',')} kg`);
  } else if (tipo === 'salgados') {
    txt += 'SALGADOS\n';
    txt += getSalgadosText(salgados);
    const total = Object.values(salgados).reduce((a, b) => a + (b ?? 0), 0);
    txt += linha('Total', `${total} unid.`);
  } else if (tipo === 'brigadeiros') {
    txt += 'BRIGADEIROS\n';
    txt += getBrigadeirosText(brigadeiros);
    const total = Object.values(brigadeiros).reduce((a, b) => a + (b ?? 0), 0);
    txt += linha('Total', `${total} unid.`);
  }

  txt += separador();
  if (order.price) {
    txt += linha('PRECO TOTAL', `E${order.price.toFixed(2)}`);
    txt += separador();
  }
  txt += linha('Status', order.status ?? 'Pendente');
  if (order.notes) {
    txt += separador();
    txt += 'Obs:\n';
    txt += `${order.notes}\n`;
  }
  txt += separador('=');
  txt += '     Obrigado pela preferencia!\n';
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
    font-size: 12px;
    width: 58mm;
    padding: 4mm;
    background: white;
    color: black;
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
    if (ok) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar recibo' });
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
