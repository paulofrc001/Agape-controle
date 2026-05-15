import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Participant, AgapeEvent } from '../types';
import { DRINKS } from './utils';

export function generateAgapePDF(eventData: AgapeEvent, participants: Participant[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(197, 160, 89); // primary gold
  doc.text('Relatório Consolidado de Ágape', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`${eventData?.storeName || 'Loja Maçônica'}`, pageWidth / 2, 30, { align: 'center' });
  doc.text(`${eventData?.name || 'Evento'} - ${format(new Date(eventData?.date || new Date()), "dd 'de' MMMM, yyyy", { locale: ptBR })}`, pageWidth / 2, 38, { align: 'center' });
  
  // Summary Stats
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Resumo de Participação', 14, 55);
  
  const presentCount = participants.filter(p => p.isPresent).length;
  const totalCount = participants.length;
  const drinkTotals = participants.reduce((acc, p) => {
    p.consumption.forEach(c => {
      acc[c.type] = (acc[c.type] || 0) + c.quantity;
    });
    return acc;
  }, {} as Record<string, number>);
  const totalDrinks = Object.values(drinkTotals).reduce((a, b) => a + b, 0);

  autoTable(doc, {
    startY: 60,
    head: [['Métrica', 'Quantidade']],
    body: [
      ['Total de Cadastrados', totalCount],
      ['Presentes', presentCount],
      ['Ausentes', totalCount - presentCount],
      ['Total de Bebidas Consumidas', totalDrinks]
    ],
    theme: 'grid',
    headStyles: { fillColor: [197, 160, 89] }
  });

  // Consumption by Drink
  doc.text('Consumo por Bebida', 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Bebida', 'Total Unidades']],
    body: DRINKS.map(d => [d, drinkTotals[d] || 0]),
    theme: 'striped',
    headStyles: { fillColor: [197, 160, 89] }
  });

  // Individual Ranking
  doc.text('Ranking de Consumo Individual', 14, (doc as any).lastAutoTable.finalY + 15);
  const ranking = [...participants]
    .map(p => ({
      name: p.name,
      type: p.type,
      total: p.consumption.reduce((sum, c) => sum + c.quantity, 0)
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Pos', 'Participante', 'Vínculo', 'Total']],
    body: ranking.map((p, i) => [i + 1, p.name, p.type, p.total]),
    theme: 'grid',
    headStyles: { fillColor: [197, 160, 89] }
  });

  return doc;
}
