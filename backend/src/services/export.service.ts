import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export class ExportService {
  private formatTimestamp(date: Date): string {
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }

  async exportToExcel(logs: any[]) {
    const data = logs.map((log) => ({
      'Log ID': log.id,
      'User ID': log.userId,
      'Name': log.name || 'N/A',
      'Email': log.email || 'N/A',
      'Status': log.result,
      'Note': log.note || '-',
      'Timestamp': this.formatTimestamp(new Date(log.createdAt)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Access Logs');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  async exportToPDF(logs: any[]) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFontSize(16);
    doc.text('AuthIntegrate - Access Logs Report', 14, 15);

    const tableData = logs.map((log) => [
      log.id.toString(),
      log.userId.toString(),
      log.name || 'N/A',
      log.email || 'N/A',
      log.result,
      log.note || '-',
      this.formatTimestamp(new Date(log.createdAt)),
    ]);

    autoTable(doc, {
      head: [['Log ID', 'User ID', 'Name', 'Email', 'Status', 'Note', 'Timestamp']],
      body: tableData,
      startY: 25,
      theme: 'grid',
    });

    return Buffer.from(doc.output('arraybuffer'));
  }
}

export const exportService = new ExportService();
