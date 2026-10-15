import { Injectable } from '@angular/core';
export interface CaptureExport {
  image: string;
  reportId: string;
  title: string;
  department: string;
  date: string;
}
export function fitImage(width: number, height: number, maxWidth = 277, maxHeight = 165) {
  if (width <= 0 || height <= 0 || ![width, height].every(Number.isFinite))
    throw new Error('Dimensiones inválidas');
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}
@Injectable({ providedIn: 'root' })
export class ExportService {
  async print(data: CaptureExport) {
    const sheet = document.createElement('section');
    sheet.className = 'print-sheet';
    const heading = document.createElement('h1');
    heading.textContent = data.title + ' · ' + data.department;
    const caption = document.createElement('p');
    caption.textContent = data.date + ' · Estado visible del informe';
    const image = new Image();
    image.src = data.image;
    image.alt = data.title;
    sheet.append(heading, caption, image);
    document.body.append(sheet);
    try {
      await image.decode();
      window.print();
    } finally {
      sheet.remove();
    }
  }
  filename(data: CaptureExport, ext: string) {
    return data.reportId + '-' + new Date().toISOString().replace(/[:.]/g, '-') + '.' + ext;
  }
  download(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    this.download(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  png(data: CaptureExport) {
    this.download(data.image, this.filename(data, 'png'));
  }
  async pdf(data: CaptureExport) {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const img = pdf.getImageProperties(data.image),
      size = fitImage(img.width, img.height);
    pdf.setFontSize(14);
    pdf.text(data.title + ' - ' + data.department, 10, 12);
    pdf.setFontSize(9);
    pdf.text(data.date + ' | Captura estática del resultado visible', 10, 19);
    pdf.addImage(data.image, 'PNG', 10, 25, size.width, size.height);
    return pdf;
  }
  async share(data: CaptureExport, format: 'png' | 'pdf'): Promise<string> {
    const blob =
      format === 'pdf'
        ? (await this.pdf(data)).output('blob')
        : await (await fetch(data.image)).blob();
    const file = new File([blob], this.filename(data, format), {
      type: format === 'pdf' ? 'application/pdf' : 'image/png',
    });
    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      this.downloadBlob(blob, file.name);
      return 'Compartir archivos no está disponible. Se descargó el archivo para enviarlo manualmente.';
    }
    try {
      await navigator.share({ files: [file], title: data.title });
      return 'Archivo compartido.';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'Envío cancelado.';
      // Some browsers lose user activation while preparing the file.
      this.downloadBlob(blob, file.name);
      return 'El navegador no permitió compartir. Se descargó el archivo para enviarlo manualmente.';
    }
  }
}
