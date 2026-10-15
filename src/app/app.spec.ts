import { TestBed } from '@angular/core/testing';
import { App } from './app';
describe('Captura', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });
  it('rechaza archivos que no son imágenes', async () => {
    const app = TestBed.createComponent(App).componentInstance;
    await app.upload({
      target: { files: [new File(['texto'], 'datos.txt', { type: 'text/plain' })], value: 'x' },
    } as unknown as Event);
    expect(app.message).toContain('Selecciona una imagen');
    expect(app.source).toBe('');
  });
  it('no permite exportar antes de confirmar', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.confirm();
    expect(app.result).toBe('');
  });
  it('invalida una confirmación al cambiar el recorte', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.result = 'anterior';
    app.change('w', { target: { value: '50' } } as unknown as Event);
    expect(app.result).toBe('');
    expect(app.crop.w).toBe(50);
  });
  it('descarta las imágenes de la sesión', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.source = 'original';
    app.result = 'recorte';
    app.clear();
    expect(app.source).toBe('');
    expect(app.result).toBe('');
  });
});

describe('Selección del informe', () => {
  it('abre TRANS y descarta una captura del informe anterior', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.source = 'captura epidemiología';
    app.result = 'recorte';
    app.selectReport('trans', 'trans-puerto-cortes');
    expect(app.department.name).toBe('TRANS');
    expect(app.report.title).toBe('Trans_PuertoCortés');
    expect(app.url).toContain('eyJrIjoiMzQ1');
    expect(app.source).toBe('');
    expect(app.result).toBe('');
    app.selectReport('epidemiologia', 'graficas-y-canal');
    expect(app.report.title).toBe('Gráficas y Canal');
  });
  it('conserva filtros al seleccionar de nuevo el mismo informe', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const report = app.report;
    app.selectReport('epidemiologia', 'graficas-y-canal');
    expect(app.report).toBe(report);
  });
  it('impide cambiar de informe durante una captura', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.busy = true;
    app.selectReport('trans', 'trans-puerto-cortes');
    expect(app.department.id).toBe('epidemiologia');
  });
});

describe('Portada y búsqueda', () => {
  it('filtra informes por departamento y muestra un resultado vacío', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.search = 'TRANS';
    expect(app.filteredDepartments.length).toBe(1);
    expect(app.filteredDepartments[0].id).toBe('trans');
    app.search = 'informe inexistente';
    expect(app.filteredDepartments.length).toBe(0);
  });
  it('abre un informe desde inicio y conserva el visor al regresar', () => {
    const app = TestBed.createComponent(App).componentInstance;
    expect(app.home).toBe(true);
    app.selectReport('epidemiologia', 'graficas-y-canal');
    expect(app.home).toBe(false);
    const report = app.report;
    app.showHome();
    expect(app.home).toBe(true);
    expect(app.report).toBe(report);
  });
});
