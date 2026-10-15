import { Injectable } from '@angular/core';
import type { Report } from './catalog';

export interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type ReportAction = 'png' | 'pdf' | 'print';
export interface ReportExportRequest {
  format: ReportAction;
  target: HTMLElement;
  insets?: Report['captureInsets'];
}
interface PortalCaptureTrack extends MediaStreamTrack {
  getCaptureHandle?(): { handle?: string } | null;
}
interface CaptureDevices extends MediaDevices {
  setCaptureHandleConfig?(config: { handle: string; permittedOrigins: string[] }): void;
}
export function cropPixels(width: number, height: number, crop: Crop) {
  const { x, y, w, h } = crop;
  if (
    ![x, y, w, h].every(Number.isFinite) ||
    x < 0 ||
    y < 0 ||
    w < 1 ||
    h < 1 ||
    x + w > 100 ||
    y + h > 100
  )
    throw new Error(
      'El área debe quedar dentro de la imagen y medir al menos 1 % de ancho y alto.',
    );
  const left = Math.round((width * x) / 100),
    top = Math.round((height * y) / 100);
  const right = Math.round((width * (x + w)) / 100),
    bottom = Math.round((height * (y + h)) / 100);
  if (right <= left || bottom <= top) throw new Error('El recorte es demasiado pequeño.');
  return { x: left, y: top, width: right - left, height: bottom - top };
}

@Injectable({ providedIn: 'root' })
export class CaptureService {
  private readonly handle = crypto.randomUUID();
  private configured = false;
  constructor() {
    try {
      const devices = navigator.mediaDevices as CaptureDevices | undefined;
      if (devices?.setCaptureHandleConfig) {
        devices.setCaptureHandleConfig({
          handle: this.handle,
          permittedOrigins: [location.origin],
        });
        this.configured = true;
      }
    } catch {
      this.configured = false;
    }
  }
  get automaticSupported() {
    return this.supported && this.configured;
  }
  async region(
    element: HTMLElement,
    insets: NonNullable<Report['captureInsets']> = { top: 0, right: 0, bottom: 0, left: 0 },
  ): Promise<string> {
    if (!this.automaticSupported)
      throw new Error(
        'Este navegador no admite exportación automática del visor. Usa Chrome o Edge de escritorio, o sube una captura del dispositivo.',
      );
    const style = element.getAttribute('style'),
      scroll = { x: scrollX, y: scrollY };
    let stream: MediaStream | undefined;
    const video = document.createElement('video');
    try {
      element.style.height =
        Math.min(element.getBoundingClientRect().height, innerHeight - 24) + 'px';
      element.style.minHeight = '0';
      element.style.maxHeight = 'none';
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
      // Keep the user gesture: obtain permission before any asynchronous processing.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions);
      const track = stream.getVideoTracks()[0] as PortalCaptureTrack;
      // Coordinates are only valid for this exact tab, never another tab/window/screen.
      if (track.getCaptureHandle?.()?.handle !== this.handle)
        throw new Error(
          'Selecciona la pestaña de este portal para exportar automáticamente. No elijas otra pestaña, ventana o pantalla.',
        );
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      const rect = element.getBoundingClientRect();
      if (
        rect.left < 0 ||
        rect.top < 0 ||
        rect.right > innerWidth + 1 ||
        rect.bottom > innerHeight + 1 ||
        !video.videoWidth ||
        !video.videoHeight
      )
        throw new Error('El visor debe quedar visible para exportarlo. Vuelve a intentarlo.');
      // Read only the authorized video, using the host iframe's outer bounds.
      // No access to the Power BI document or DOM is attempted.
      const sx = video.videoWidth / innerWidth,
        sy = video.videoHeight / innerHeight;
      if (
        Object.values(insets).some((value) => !Number.isFinite(value) || value < 0) ||
        insets.left + insets.right >= rect.width ||
        insets.top + insets.bottom >= rect.height
      )
        throw new Error('El encuadre configurado no cabe en el visor.');
      const x = Math.round((rect.left + insets.left) * sx),
        y = Math.round((rect.top + insets.top) * sy);
      const width = Math.round((rect.right - insets.right) * sx) - x,
        height = Math.round((rect.bottom - insets.bottom) * sy) - y;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo preparar la imagen.');
      ctx.drawImage(video, x, y, width, height, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      if (style === null) element.removeAttribute('style');
      else element.setAttribute('style', style);
      window.scrollTo({ left: scroll.x, top: scroll.y, behavior: 'instant' });
    }
  }
  get supported() {
    return window.isSecureContext && !!navigator.mediaDevices?.getDisplayMedia;
  }
  async screen(): Promise<string> {
    if (!this.supported)
      throw new Error(
        'La captura directa no está disponible. Toma una captura con tu dispositivo y súbela.',
      );
    let stream: MediaStream | undefined;
    const video = document.createElement('video');
    try {
      // Invoke directly from the click: no work that could consume user activation first.
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      if (!video.videoWidth || !video.videoHeight)
        throw new Error('No se recibió una imagen de la pantalla.');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo preparar la captura.');
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/png');
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  }
  async image(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 40000000)
      throw new Error('Imagen inválida o demasiado grande.');
    return img;
  }
  crop(image: HTMLImageElement, selection: Crop): string {
    const rect = cropPixels(image.naturalWidth, image.naturalHeight, selection);
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar el recorte.');
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    return canvas.toDataURL('image/png');
  }
}
