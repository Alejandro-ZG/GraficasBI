import { TestBed } from '@angular/core/testing';
import { App } from './app';
describe('Catálogo', () => {
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
