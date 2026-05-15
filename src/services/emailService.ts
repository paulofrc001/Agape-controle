import { Participant, AgapeEvent } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateAgapePDF } from '../lib/reportUtils';

export const emailService = {
  async sendReportWithPDF(event: AgapeEvent, participants: Participant[]) {
    if (!event.adminEmail) {
      console.warn('Admin email not configured');
      return;
    }

    const doc = generateAgapePDF(event, participants);
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    const subject = `Relatório Consolidado: ${event.name} - ${format(new Date(), 'dd/MM/yyyy')}`;
    const html = `
      <div style="font-family: serif; padding: 20px; color: #1a1a1a;">
        <h1 style="color: #c5a059;">Relatório de Ágape</h1>
        <p>Olá, Mestre de Banquete.</p>
        <p>O evento <strong>${event.name}</strong> da loja <strong>${event.storeName}</strong> foi finalizado.</p>
        <p>Em anexo, você encontrará o relatório consolidado de presença e consumo em formato PDF.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 10px; color: #666;">Sistema de Ágape - Gestão Maçônica Operacional</p>
      </div>
    `;

    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: event.adminEmail,
          subject,
          html,
          attachments: [
            {
              filename: `Relatorio_Agape_${event.name}.pdf`,
              content: pdfBase64,
              encoding: 'base64'
            }
          ]
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      return true;
    } catch (error) {
      console.error('Error calling send-report API:', error);
      throw error;
    }
  },

  async sendTestEmail(email: string) {
    const subject = "Teste de Configuração - Sistema de Ágape";
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #c5a059; border-radius: 10px;">
        <h2 style="color: #c5a059;">Conexão Bem-sucedida!</h2>
        <p>Este é um e-mail de teste para confirmar que as configurações de SMTP estão corretas.</p>
        <p>Agora você receberá os relatórios automáticos ao finalizar os eventos.</p>
      </div>
    `;

    const response = await fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject, html })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server responded with error:', response.status, errorText);
      return { success: false, error: `Server error (${response.status}): ${errorText}` };
    }

    return await response.json();
  }
};
