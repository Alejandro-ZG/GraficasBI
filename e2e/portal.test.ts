import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.beforeEach(async ({ page }) => {
  await page.route('https://app.powerbi.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html style="background:#087f80;height:100%"><body style="margin:0;background:#087f80;color:white">INFORME FILTRADO DE PRUEBA</body></html>',
    }),
  );
  await page.goto('/');
});
test('cada departamento muestra solo sus informes', async ({ page }) => {
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  await expect(page.getByRole('navigation', { name: 'Informes de Epidemiología' })).toBeVisible();
  await expect(page.getByText('Trans_PuertoCortés', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos los departamentos' }).click();
  await page.getByRole('button', { name: 'Consultar informe' }).nth(1).click();
  await expect(page.getByRole('navigation', { name: 'Informes de TRANS' })).toBeVisible();
  await expect(page.getByText('Gráficas y Canal', { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});
for (const format of ['PNG', 'PDF'])
  test('subir captura descarga ' + format + ' sin editor', async ({ page }, info) => {
    await page.getByRole('button', { name: 'Consultar informe' }).first().click();
    await page.getByText('Usar una captura del dispositivo', { exact: true }).click();
    await page.getByLabel('Acción para la captura').selectOption(format.toLowerCase());
    const data = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 400;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#087f80';
      ctx.fillRect(0, 0, 800, 400);
      return c.toDataURL().split(',')[1];
    });
    const pending = page.waitForEvent('download');
    await page.locator('input[type=file]').setInputFiles({
      name: 'captura.png',
      mimeType: 'image/png',
      buffer: Buffer.from(data, 'base64'),
    });
    const file = await pending;
    expect(file.suggestedFilename()).toMatch(new RegExp('\\.' + format.toLowerCase() + '$'));
    await file.saveAs(info.outputPath('resultado.' + format.toLowerCase()));
    await expect(page.getByRole('button', { name: /Confirmar|Recort/ })).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Se preparó la descarga');
  });
test('archivo corrupto permite volver a intentar', async ({ page }) => {
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  await page.getByText('Usar una captura del dispositivo', { exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'corrupto.png',
    mimeType: 'image/png',
    buffer: Buffer.from('corrupto'),
  });
  await expect(page.getByRole('status')).toContainText('Imagen inválida');
  await expect(page.locator('input[type=file]')).toBeEnabled();
});
test('cancelar permiso no descarga ni bloquea la interfaz', async ({ page }, info) => {
  test.skip(!['chrome', 'edge'].includes(info.project.name), 'Permisos de captura de escritorio.');
  await page.evaluate(() => {
    (window as any).CropTarget = { fromElement: async () => ({}) };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: async () => {
          throw new DOMException('cancel', 'NotAllowedError');
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  await page.getByRole('button', { name: 'Descargar imagen', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Permiso cancelado');
  await expect(page.getByRole('button', { name: 'Descargar imagen', exact: true })).toBeEnabled();
});
for (const format of ['png', 'pdf', 'print'] as const)
  test('recorte automático real del iframe: ' + format, async ({ page }, info) => {
    test.skip(
      !['chrome', 'edge'].includes(info.project.name),
      'Region Capture real se valida en navegadores de escritorio compatibles.',
    );
    await page.evaluate(() => {
      const original = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async (options) => {
        const stream = await original(options);
        (window as any).lastTestStream = stream;
        return stream;
      };
      window.print = () => {
        (window as any).printed = document.querySelector('.print-sheet')?.textContent;
      };
    });
    await page.getByRole('button', { name: 'Consultar informe' }).first().click();
    const label = { png: 'Descargar imagen', pdf: 'Descargar PDF', print: 'Imprimir' }[format];
    const bounds = await page.locator('iframe').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        width: Math.round(r.width),
        height: Math.round(Math.min(r.height, innerHeight - 24)),
      };
    });
    const pending = format === 'print' ? null : page.waitForEvent('download');
    await page.getByRole('button', { name: label, exact: true }).click();
    if (pending) {
      const file = await pending;
      await file.saveAs(info.outputPath('automatico.' + format));
      if (format === 'png') {
        const content = await readFile((await file.path())!);
        const sample = await page.evaluate(async (base64) => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + base64;
          await img.decode();
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          return {
            width: c.width,
            height: c.height,
            pixel: Array.from(ctx.getImageData(c.width / 2, c.height / 2, 1, 1).data),
          };
        }, content.toString('base64'));
        // The browser may downscale tab capture. Compare the target's aspect ratio,
        // rather than assuming one video pixel per CSS pixel.
        expect(sample.width).toBeGreaterThan(200);
        expect(Math.abs(sample.width / sample.height - bounds.width / bounds.height)).toBeLessThan(
          0.015,
        );
        [8, 127, 128, 255].forEach((v, i) =>
          expect(Math.abs(v - sample.pixel[i])).toBeLessThanOrEqual(3),
        );
      }
    } else {
      await expect(page.getByRole('status')).toContainText('diálogo de impresión');
      expect(await page.evaluate(() => (window as any).printed)).toContain('Gráficas y Canal');
    }
    await expect(page.getByRole('status')).toContainText(
      format === 'print' ? 'diálogo' : 'descarga',
    );
    expect(
      await page.evaluate(() =>
        (window as any).lastTestStream
          .getTracks()
          .every((t: MediaStreamTrack) => t.readyState === 'ended'),
      ),
    ).toBeTruthy();
    expect(await page.locator('iframe').getAttribute('style')).toBeNull();
    await expect(page.getByRole('button', { name: /Confirmar|Recort/ })).toHaveCount(0);
  });
test('navegador sin captura automática ofrece la alternativa del dispositivo', async ({ page }) => {
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {} }),
  );
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  await page.getByRole('button', { name: 'Descargar PDF', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('no admite exportación automática');
  await expect(page.locator('input[type=file]')).toBeVisible();
  await expect(page.getByLabel('Acción para la captura')).toHaveValue('pdf');
});
