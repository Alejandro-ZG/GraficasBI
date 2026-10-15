import { TestBed } from '@angular/core/testing';
import { vi, afterEach } from 'vitest';
import { CaptureService, cropPixels } from './capture.service';
describe('Geometría del recorte', () => {
  it('selecciona exactamente el área central sin alterar proporciones', () => {
    expect(cropPixels(800, 400, { x: 25, y: 25, w: 50, h: 50 })).toEqual({
      x: 200,
      y: 100,
      width: 400,
      height: 200,
    });
  });
  it('rechaza coordenadas fuera de la imagen o no finitas', () => {
    for (const crop of [
      { x: 80, y: 0, w: 30, h: 10 },
      { x: -1, y: 0, w: 50, h: 50 },
      { x: 0, y: NaN, w: 50, h: 50 },
      { x: 0, y: 0, w: 0, h: 50 },
    ])
      expect(() => cropPixels(800, 400, crop)).toThrow();
  });
});
describe('Permisos y liberación de pantalla', () => {
  afterEach(() => vi.restoreAllMocks());
  it('propaga una cancelación para mostrarla en la interfaz', async () => {
    const service = TestBed.inject(CaptureService);
    vi.spyOn(service, 'supported', 'get').mockReturnValue(true);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn().mockRejectedValue(new DOMException('cancel', 'NotAllowedError')),
      },
    });
    await expect(service.screen()).rejects.toMatchObject({ name: 'NotAllowedError' });
  });
  it('detiene todas las pistas aunque falle la reproducción', async () => {
    const service = TestBed.inject(CaptureService);
    const stop = vi.fn();
    vi.spyOn(service, 'supported', 'get').mockReturnValue(true);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) },
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('video failed'));
    await expect(service.screen()).rejects.toThrow('video failed');
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
