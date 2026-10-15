import { fitImage } from './export.service';
describe('PDF sin distorsión', () => {
  it('ajusta un gráfico horizontal dentro de la página', () => {
    const s = fitImage(1600, 900);
    expect(s.width).toBeLessThanOrEqual(277);
    expect(s.height).toBeLessThanOrEqual(165);
    expect(s.width / s.height).toBeCloseTo(1600 / 900);
  });
  it('ajusta una captura vertical sin estirarla', () => {
    const s = fitImage(400, 1000);
    expect(s.height).toBe(165);
    expect(s.width / s.height).toBeCloseTo(0.4);
  });
});
