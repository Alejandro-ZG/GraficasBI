import { Injectable } from '@angular/core';

export interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
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
