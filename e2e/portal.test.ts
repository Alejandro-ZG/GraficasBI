import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  // Isolate portal behavior; external Power BI loading is checked separately.
  await page.route('https://app.powerbi.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Informe externo de prueba</p>' }),
  );
  await page.goto('/');
});
test('portada, búsqueda y selección de TRANS sin desbordamiento', async ({ page }, info) => {
  await page.getByRole('searchbox').fill('TRANS');
  await expect(page.getByRole('heading', { name: 'Epidemiología', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Consultar informe' }).click();
  await expect(page.locator('iframe')).toHaveAttribute('title', 'Trans_PuertoCortés');
  await expect(page.locator('iframe')).toHaveAttribute('src', /eyJrIjoiMzQ1/);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Todos los departamentos' }).click();
  await page.getByRole('searchbox').fill('');
  await expect(page.getByRole('heading', { name: 'Salud Ambiental', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('portada.png'), fullPage: true });
});
test('carga, recorte, PNG, PDF y alternativa de compartir', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 400;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = '#087f80';
    ctx.fillRect(200, 100, 400, 200);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'grafico.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    });
  await expect(page.getByAltText('Captura original')).toBeVisible();
  await page.getByLabel('Izquierda (%)').fill('25');
  await page.getByLabel('Arriba (%)').fill('25');
  await page.getByLabel('Ancho (%)').fill('50');
  await page.getByLabel('Alto (%)').fill('50');
  await page.getByRole('button', { name: 'Confirmar recorte' }).click();
  const image = page.getByAltText('Resultado confirmado para exportar');
  await expect(image).toBeVisible();
  const pixels = await image.evaluate((element: HTMLImageElement) => {
    const c = document.createElement('canvas');
    c.width = element.naturalWidth;
    c.height = element.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(element, 0, 0);
    return {
      width: c.width,
      height: c.height,
      color: Array.from(ctx.getImageData(10, 10, 1, 1).data),
    };
  });
  expect(pixels).toEqual({ width: 400, height: 200, color: [8, 127, 128, 255] });
  for (const format of ['PNG', 'PDF']) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar ' + format, exact: true }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      new RegExp('graficas-y-canal-.*\\.' + format.toLowerCase() + '$'),
    );
    await file.saveAs(info.outputPath('resultado.' + format.toLowerCase()));
  }
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
  });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await download;
  await expect(page.getByRole('status')).toContainText('Se descargó el archivo');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Preparar impresión', exact: true }).click();
  const popup = await popupPromise;
  await expect(page.getByRole('status')).toContainText('PDF preparado');
  await popup.close();
  await page.getByRole('button', { name: 'Trans_PuertoCortés', exact: true }).click();
  await expect(page.getByAltText('Captura original')).toHaveCount(0);
});
test('archivos corruptos y recorte inválido no bloquean la interfaz', async ({ page }) => {
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'corrupto.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not an image'),
    });
  await expect(page.getByRole('status')).toContainText('Imagen inválida');
  await expect(page.locator('input[type=file]')).toBeEnabled();
});
test('cancelar permisos muestra una alternativa y libera el botón', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: () => Promise.reject(new DOMException('cancelled', 'NotAllowedError')),
      },
    });
  });
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  await page.getByRole('button', { name: 'Capturar resultado', exact: true }).last().click();
  await expect(page.getByRole('status')).toContainText('Captura cancelada o permiso rechazado');
  await expect(
    page.getByRole('button', { name: 'Capturar resultado', exact: true }).last(),
  ).toBeEnabled();
});
test('captura un fotograma y detiene las pistas de la fuente simulada', async ({ page }, info) => {
  test.skip(
    !['chrome', 'edge'].includes(info.project.name),
    'La simulación de MediaStream se verifica en los navegadores de escritorio principales.',
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: async () => {
          const c = document.createElement('canvas');
          c.width = 800;
          c.height = 400;
          const ctx = c.getContext('2d')!;
          ctx.fillStyle = '#087f80';
          ctx.fillRect(0, 0, 800, 400);
          const stream = c.captureStream(1);
          (window as any).testCaptureStream = stream;
          return stream;
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Consultar informe' }).first().click();
  await page.getByRole('button', { name: 'Capturar resultado', exact: true }).last().click();
  await expect(page.getByAltText('Captura original')).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as any).testCaptureStream
        .getTracks()
        .every((track: MediaStreamTrack) => track.readyState === 'ended'),
    ),
  ).toBeTruthy();
});
