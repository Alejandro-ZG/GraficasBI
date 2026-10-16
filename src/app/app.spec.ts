import { TestBed } from '@angular/core/testing';
import { App } from './app';
describe('Catálogo', () => {
  it('permite cambiar entre canales endémicos y gráficas', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.selectReport('epidemiologia', 'canales-endemicos');
    expect(app.report.title).toBe('Canales Endémicos');
    expect(app.url).toContain('r=eyJrIjoiZmExZTFiMjct');
    expect(app.home).toBe(false);
    app.selectReport('epidemiologia', 'graficas');
    expect(app.report.title).toBe('Gráficas');
    expect(new URL(app.url).searchParams.get('pageName')).toBe('71ece924eafb685c258f');
  });
  it('selecciona el informe de TRANS', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.selectReport('trans', 'trans-puerto-cortes');
    expect(app.department.name).toBe('TRANS');
    expect(app.report.title).toBe('Trans_PuertoCortés');
    expect(app.home).toBe(false);
  });
  it('conserva el informe activo al volver al inicio', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.selectReport('trans', 'trans-puerto-cortes');
    const report = app.report;
    app.showHome();
    expect(app.home).toBe(true);
    expect(app.report).toBe(report);
  });
  it('busca por departamento y maneja resultados vacíos', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.search = 'TRANS';
    expect(app.filteredDepartments.map((d) => d.id)).toEqual(['trans']);
    app.search = 'inexistente';
    expect(app.filteredDepartments).toEqual([]);
  });
});
