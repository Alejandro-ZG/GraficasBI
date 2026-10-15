import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Report, validateReportUrl } from './catalog';
import { ReportExportRequest } from './capture.service';
@Component({
  selector: 'app-report-viewer',
  template: `<section class="panel report-viewer" #viewer aria-labelledby="report-title">
    <div class="heading">
      <div>
        <p class="eyebrow">{{ department() }} · POWER BI</p>
        <h2 id="report-title">{{ report().title }}</h2>
      </div>
      <a [href]="url()" target="_blank" rel="noopener noreferrer">Abrir original ↗</a>
    </div>
    <p class="hint">
      Aplica los filtros dentro del informe. Si no carga, abre el original. La actualización de los
      datos depende de Power BI.
    </p>
    <div class="actions">
      <button class="secondary" (click)="fullscreen(viewer)">Pantalla completa / Salir</button
      ><button class="secondary" (click)="reload(frame)" [disabled]="busy()">
        Recargar informe
      </button>
      <button
        (click)="
          exportRequest.emit({ format: 'png', target: frame, insets: report().captureInsets })
        "
        [disabled]="busy()"
      >
        Descargar imagen
      </button>
      <button
        (click)="
          exportRequest.emit({ format: 'pdf', target: frame, insets: report().captureInsets })
        "
        [disabled]="busy()"
      >
        Descargar PDF
      </button>
      <button
        (click)="
          exportRequest.emit({ format: 'print', target: frame, insets: report().captureInsets })
        "
        [disabled]="busy()"
      >
        Imprimir
      </button>
    </div>
    <p class="hint">
      Aplica tus filtros y elige descargar o imprimir. Autoriza la captura de
      <strong>esta pestaña del portal</strong>: el área del informe se detecta automáticamente, sin
      editar ni recortar.
    </p>
    <p class="hint">
      Se exporta el área visible del informe. Recargar puede reiniciar los filtros y no fuerza la
      actualización de la caché de Power BI.
    </p>
    @if (waiting) {
      <p role="status" class="hint">
        El visor está tardando. Puedes abrir el informe original o recargarlo.
      </p>
    }
    <iframe
      #frame
      [src]="embed()"
      [title]="report().title"
      (load)="loaded()"
      allow="fullscreen"
      allowfullscreen
    ></iframe>
  </section>`,
})
export class ReportViewer {
  readonly report = input.required<Report>();
  readonly department = input.required<string>();
  readonly supported = input(false);
  readonly busy = input(false);
  readonly exportRequest = output<ReportExportRequest>();
  readonly notice = output<string>();
  private readonly changes = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  readonly url = computed(() => validateReportUrl(this.report().publicEmbedUrl));
  readonly embed = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.url()));
  waiting = false;
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    effect((onCleanup) => {
      this.report();
      this.armTimeout();
      onCleanup(() => clearTimeout(this.timer));
    });
  }
  private armTimeout() {
    clearTimeout(this.timer);
    this.waiting = false;
    this.timer = setTimeout(() => {
      this.waiting = true;
      this.changes.markForCheck();
    }, 20000);
  }
  loaded() {
    clearTimeout(this.timer);
    this.waiting = false;
  }
  reload(frame: HTMLIFrameElement) {
    if (this.busy()) return;
    this.armTimeout();
    frame.src = this.url();
    this.notice.emit(
      'Se solicitó recargar el informe. Los filtros pueden reiniciarse. Power BI puede seguir mostrando datos en caché.',
    );
  }
  async fullscreen(element: HTMLElement) {
    try {
      if (document.fullscreenElement === element) await document.exitFullscreen();
      else if (element.requestFullscreen) await element.requestFullscreen();
      else
        this.notice.emit(
          'Este navegador no permite pantalla completa. Abre el informe original para ampliar la vista.',
        );
    } catch {
      this.notice.emit(
        'No se pudo abrir pantalla completa. Usa el informe original o inténtalo de nuevo.',
      );
    }
  }
}
