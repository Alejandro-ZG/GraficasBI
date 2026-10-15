import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CaptureService } from './capture.service';
import { ExportService } from './export.service';
import { ReportViewer } from './report-viewer';
import { DEPARTMENTS, validateReportUrl } from './catalog';
@Component({ selector: 'app-root', templateUrl: './app.html', imports: [ReportViewer] })
export class App {
  readonly departments = DEPARTMENTS;
  readonly availableDepartments = DEPARTMENTS.filter((area) => area.reports.length).length;
  home = true;
  search = '';
  get filteredDepartments() {
    const query = this.search.trim().toLocaleLowerCase('es');
    return this.departments
      .map((area) => ({
        ...area,
        reports: area.reports.filter((report) =>
          (area.name + ' ' + report.title + ' ' + report.description)
            .toLocaleLowerCase('es')
            .includes(query),
        ),
      }))
      .filter(
        (area) =>
          area.reports.length ||
          (!this.departments.find((d) => d.id === area.id)!.reports.length &&
            area.name.toLocaleLowerCase('es').includes(query)),
      );
  }
  showHome() {
    if (!this.busy) this.home = true;
  }
  private readonly changes = inject(ChangeDetectorRef);
  private readonly captures = inject(CaptureService);
  private readonly exports = inject(ExportService);
  department = DEPARTMENTS[0];
  report = this.department.reports[0];
  url = validateReportUrl(this.report.publicEmbedUrl);

  get supported() {
    return this.captures.supported;
  }
  source = '';
  result = '';
  message = '';
  busy = false;
  date = '';
  crop = { x: 0, y: 0, w: 100, h: 100 };
  readonly fields = ['x', 'y', 'w', 'h'] as const;
  readonly labels = { x: 'Izquierda', y: 'Arriba', w: 'Ancho', h: 'Alto' };
  private original?: HTMLImageElement;
  selectReport(departmentId: string, reportId: string) {
    if (this.busy) return;
    const department = this.departments.find((d) => d.id === departmentId);
    const report = department?.reports.find((r) => r.id === reportId);
    if (!department || !report) return;
    this.home = false;
    if (report === this.report) return;
    const url = validateReportUrl(report.publicEmbedUrl);
    this.clear();
    this.department = department;
    this.report = report;
    this.url = url;
  }
  async capture() {
    if (this.busy) return;
    this.busy = true;
    this.message = '';
    try {
      await this.load(await this.captures.screen());
    } catch (error) {
      this.message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Captura cancelada o permiso rechazado. Puedes intentarlo de nuevo o subir una imagen.'
          : error instanceof Error
            ? error.message
            : 'No se pudo capturar. Sube una captura del sistema.';
    } finally {
      this.busy = false;
      this.changes.markForCheck();
    }
  }
  async upload(event: Event) {
    if (this.busy) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      this.message = 'Selecciona una imagen de hasta 20 MB.';
      return;
    }
    this.busy = true;
    const url = URL.createObjectURL(file);
    try {
      await this.load(url);
    } catch {
      this.message =
        'Imagen inválida o demasiado grande. Usa PNG o JPEG de menos de 40 megapíxeles.';
    } finally {
      URL.revokeObjectURL(url);
      this.busy = false;
      this.changes.markForCheck();
    }
  }
  private async load(url: string) {
    const img = await this.captures.image(url);
    const source = this.captures.crop(img, { x: 0, y: 0, w: 100, h: 100 });
    this.original = img;
    this.source = source;
    this.date = new Date().toLocaleString('es-HN');
    this.reset();
    this.message = '';
  }
  change(key: 'x' | 'y' | 'w' | 'h', e: Event) {
    this.crop[key] = Math.max(0, Math.min(100, Number((e.target as HTMLInputElement).value) || 0));
    this.result = '';
  }
  reset() {
    this.crop = { x: 0, y: 0, w: 100, h: 100 };
    this.result = '';
  }
  clear() {
    this.source = '';
    this.result = '';
    this.original = undefined;
    this.message = '';
  }
  confirm() {
    if (!this.original) return;
    try {
      this.result = this.captures.crop(this.original, this.crop);
      this.message = 'Recorte confirmado. Ya puedes exportarlo.';
    } catch (error) {
      this.result = '';
      this.message = error instanceof Error ? error.message : 'No se pudo recortar.';
    }
  }
  private snapshot() {
    return {
      image: this.result,
      reportId: this.report.id,
      title: this.report.title,
      department: this.department.name,
      date: this.date,
    };
  }
  png() {
    if (this.result) this.exports.png(this.snapshot());
  }
  async exportPdf() {
    if (!this.result) return;
    const data = this.snapshot(),
      filename = this.exports.filename(data, 'pdf');
    try {
      (await this.exports.pdf(data)).save(filename);
    } catch {
      this.message =
        'No se pudo preparar el PDF. Comprueba la conexión y vuelve a intentarlo; también puedes descargar el PNG.';
    } finally {
      this.changes.markForCheck();
    }
  }
  async print() {
    if (!this.result) return;
    const data = this.snapshot();
    const tab = window.open('about:blank', '_blank');
    if (!tab) {
      this.message = 'Ventana bloqueada. Descarga el PDF y ábrelo para imprimir.';
      return;
    }
    tab.opener = null;
    try {
      const pdf = await this.exports.pdf(data);
      pdf.autoPrint();
      const url = URL.createObjectURL(pdf.output('blob'));
      tab.location.href = url;
      this.message =
        'PDF preparado. Usa el diálogo de impresión del visor si no se abre automáticamente.';
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      tab.close();
      this.message =
        'No se pudo preparar el PDF para imprimir. Comprueba la conexión y vuelve a intentarlo.';
    } finally {
      this.changes.markForCheck();
    }
  }
  async share(format: 'png' | 'pdf' = 'png') {
    if (!this.result) return;
    try {
      this.message = await this.exports.share(this.snapshot(), format);
    } catch {
      this.message = 'No se pudo preparar el archivo. Descarga el PNG o vuelve a intentarlo.';
    } finally {
      this.changes.markForCheck();
    }
  }
}
