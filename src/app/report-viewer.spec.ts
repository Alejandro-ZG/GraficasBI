import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ReportViewer } from './report-viewer';
import { DEPARTMENTS } from './catalog';
function viewer() {
  const fixture = TestBed.createComponent(ReportViewer);
  fixture.componentRef.setInput('report', DEPARTMENTS[1].reports[0]);
  fixture.componentRef.setInput('department', 'TRANS');
  return fixture.componentInstance;
}
describe('Visor', () => {
  it('recarga la URL validada de TRANS y avisa de los filtros', () => {
    const app = viewer(),
      emit = vi.spyOn(app.notice, 'emit'),
      frame = { src: '' } as HTMLIFrameElement;
    app.reload(frame);
    expect(frame.src).toBe(DEPARTMENTS[1].reports[0].publicEmbedUrl);
    expect(emit).toHaveBeenCalledWith(expect.stringContaining('filtros pueden reiniciarse'));
  });
  it('explica cuando pantalla completa no está disponible', async () => {
    const app = viewer(),
      emit = vi.spyOn(app.notice, 'emit');
    await app.fullscreen({} as HTMLElement);
    expect(emit).toHaveBeenCalledWith(expect.stringContaining('no permite pantalla completa'));
  });
  it('maneja una petición de pantalla completa rechazada', async () => {
    const app = viewer(),
      emit = vi.spyOn(app.notice, 'emit');
    await app.fullscreen({
      requestFullscreen: () => Promise.reject(new Error()),
    } as unknown as HTMLElement);
    expect(emit).toHaveBeenCalledWith(expect.stringContaining('No se pudo abrir'));
  });
});
