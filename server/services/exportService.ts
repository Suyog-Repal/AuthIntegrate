// 🔥 PHASE 6: Export service for logs (Excel & PDF)
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LogEntry {
  id: number;
  userId: number;
  name?: string;
  email?: string;
  result: 'GRANTED' | 'DENIED' | 'REGISTERED';
  note?: string;
  createdAt: string;
}

export async function exportLogsToExcel(logs: LogEntry[], filename: string = `logs_${new Date().toISOString().split('T')[0]}.xlsx`): Promise<Buffer> {
  try {
    if (!logs || logs.length === 0) {
      console.warn('⚠️  No logs to export');
    }

    // Prepare data for Excel
    const data = logs.map((log) => ({
      'Log ID': log.id,
      'User ID': log.userId,
      'Name': log.name || 'N/A',
      'Email': log.email || 'N/A',
      'Status': log.result,
      'Note': log.note || '-',
      'Timestamp': new Date(log.createdAt).toLocaleString(),
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Access Logs');

    // Set column widths
    const wscols = [
      { wch: 10 }, // Log ID
      { wch: 10 }, // User ID
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 12 }, // Status
      { wch: 20 }, // Note
      { wch: 20 }, // Timestamp
    ];
    worksheet['!cols'] = wscols;

    // Convert to buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
    console.log(`✅ Excel export successful: ${buffer.length} bytes`);
    return buffer;
  } catch (error: any) {
    console.error('❌ Excel export error:', error.message);
    throw new Error(`Failed to export logs to Excel: ${error.message}`);
  }
}

export async function exportLogsToPDF(logs: LogEntry[], filename: string = `logs_${new Date().toISOString().split('T')[0]}.pdf`): Promise<Buffer> {
  try {
    if (!logs || logs.length === 0) {
      console.warn('⚠️  No logs to export - returning empty PDF');
    }

    // Validate jsPDF instance creation
    let doc: any;
    try {
      doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
    } catch (docError) {
      console.error('❌ Failed to initialize jsPDF:', docError);
      throw new Error(`jsPDF initialization failed: ${(docError as any)?.message || 'Unknown error'}`);
    }

    if (!doc || typeof doc.text !== 'function') {
      throw new Error('jsPDF instance is not properly initialized - missing required methods');
    }

    // Add title
    doc.setFontSize(16);
    doc.text('AuthIntegrate - Access Logs Report', 14, 15);

    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.text(`Total Records: ${logs.length}`, 14, 32);

    // Prepare table data
    const tableData = logs.map((log) => [
      log.id.toString(),
      log.userId.toString(),
      log.name || 'N/A',
      log.email || 'N/A',
      log.result,
      log.note || '-',
      new Date(log.createdAt).toLocaleString(),
    ]);

    const headers = ['Log ID', 'User ID', 'Name', 'Email', 'Status', 'Note', 'Timestamp'];

    // Add table using autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      theme: 'grid',
      margin: 10,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        textColor: [50, 50, 50],
      },
      columnStyles: {
        4: {
          halign: 'center',
        },
      },
      foot: [
        [
          '',
          '',
          '',
          '',
          '',
          `Total: ${logs.length}`,
          new Date().toLocaleString(),
        ],
      ],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [100, 100, 100],
        fontStyle: 'bold',
      },
      didDrawPage: (data: any) => {
        // This is the page height
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height;
        const pageWidth = pageSize.width;
        const pageCount = (doc as any).internal.pages.length - 1;

        // Add footer with page numbers
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    // Get PDF as buffer with error handling
    let pdfBuffer: any;
    try {
      pdfBuffer = doc.output('arraybuffer');
      if (!pdfBuffer) {
        throw new Error('PDF output is empty - doc.output() returned null or undefined');
      }
    } catch (outputError) {
      console.error('❌ Failed to output PDF:', outputError);
      throw new Error(`PDF output generation failed: ${(outputError as any)?.message || 'Unknown error'}`);
    }

    const buffer = Buffer.from(pdfBuffer);
    console.log(`✅ PDF export successful: ${buffer.length} bytes, ${logs.length} records`);
    return buffer;
  } catch (error: any) {
    console.error('❌ PDF export error details:');
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    console.error('  Error object:', error);
    
    // Provide more context in the error message
    const errorContext = error.stack ? error.stack.split('\n').slice(0, 3).join(' | ') : 'No stack trace';
    throw new Error(`PDF Export Error: ${error.message || 'Unknown error'} [${errorContext}]`);
  }
}
