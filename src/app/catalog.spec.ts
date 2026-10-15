import { describe, it, expect } from 'vitest';
import { DEPARTMENTS, validateReportUrl } from './catalog';
describe('Catálogo público', () => {
  it('incluye Gráficas y Canal en Epidemiología', () => {
    expect(DEPARTMENTS[0].name).toBe('Epidemiología');
    expect(DEPARTMENTS[0].reports[0].title).toBe('Gráficas y Canal');
    expect(validateReportUrl(DEPARTMENTS[0].reports[0].publicEmbedUrl)).toContain(
      'https://app.powerbi.com/view?r=',
    );
  });
  it('rechaza otros orígenes y protocolos', () => {
    for (const url of [
      'https://app.powerbi.com.ejemplo.com/view?r=x',
      'http://app.powerbi.com/view?r=x',
      'javascript:alert(1)',
      'https://app.powerbi.com/view',
    ])
      expect(() => validateReportUrl(url)).toThrow();
  });
});
