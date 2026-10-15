import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CaptureService, ReportAction, ReportExportRequest } from './capture.service';
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
    return this.captures.automaticSupported;
  }
  source = '';
  result = '';
  message = '';
  busy = false;
  date = '';
  fallbackAction: ReportAction = 'png';
  fallbackOpen = false;
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
  clear() {
    this.source = '';
    this.result = '';
    this.message = '';
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
  private async perform(format: ReportAction) {
    const data = this.snapshot();
    if (format === 'png') this.exports.png(data);
    else if (format === 'pdf')
      (await this.exports.pdf(data)).save(this.exports.filename(data, 'pdf'));
    else await this.exports.print(data);
    this.message =
      format === 'print'
        ? 'Se abrió el diálogo de impresión del resultado actual.'
        : 'Se preparó la descarga ' + format.toUpperCase() + ' del resultado actual.';
  }
  async automatic(request: ReportExportRequest) {
    if (this.busy) return;
    this.clear();
    this.fallbackAction = request.format;
    if (!this.supported) {
      this.fallbackOpen = true;
      this.message =
        'Este navegador no admite exportación automática del visor. Usa Chrome o Edge de escritorio, o sube una captura del dispositivo.';
      return;
    }
    this.busy = true;
    try {
      this.result = this.source = await this.captures.region(request.target);
      this.date = new Date().toLocaleString('es-HN');
      await this.perform(request.format);
    } catch (error) {
      this.result = this.source = '';
      this.message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Permiso cancelado o rechazado. Vuelve a pulsar la acción y selecciona la pestaña de este portal.'
          : error instanceof Error
            ? error.message
            : 'No se pudo exportar el resultado. Vuelve a intentarlo.';
    } finally {
      this.busy = false;
      this.changes.markForCheck();
    }
  }
  async upload(event: Event) {
    if (this.busy) return;
    const input = event.target as HTMLInputElement,
      file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.clear();
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      this.message = 'Selecciona una imagen de hasta 20 MB.';
      return;
    }
    this.busy = true;
    const url = URL.createObjectURL(file),
      format = this.fallbackAction;
    try {
      const image = await this.captures.image(url);
      this.result = this.source = this.captures.crop(image, { x: 0, y: 0, w: 100, h: 100 });
      this.date = new Date().toLocaleString('es-HN');
      await this.perform(format);
    } catch (error) {
      this.result = this.source = '';
      this.message =
        error instanceof DOMException && error.name === 'EncodingError'
          ? 'Imagen inválida. Usa PNG o JPEG.'
          : error instanceof Error
            ? error.message
            : 'No se pudo procesar la imagen.';
    } finally {
      URL.revokeObjectURL(url);
      this.busy = false;
      this.changes.markForCheck();
    }
  }
}
