import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('https://app.powerbi.com/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<h1>Informe público</h1>' }),
  );
  await page.goto('/');
});
test('cada departamento muestra solo sus informes', async ({ page }) => {
  await page.getByRole('button', { name: 'Ver informe' }).first().click();
  await expect(page.getByRole('navigation', { name: 'Informes de Epidemiología' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'TRANS', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos los departamentos' }).click();
  await page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'TRANS', exact: true }) })
    .getByRole('button', { name: 'Ver informe' })
    .click();
  await expect(page.getByRole('navigation', { name: 'Informes de TRANS' })).toBeVisible();
  await expect(page.getByText('Gráficas', { exact: true })).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveAttribute('title', 'TRANS');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});
test('consulta sin funciones de captura o exportación', async ({ page }, info) => {
  const logo = page.getByRole('img', { name: 'Secretaría de Salud de Honduras' });
  await expect(logo).toBeVisible();
  await expect
    .poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Ver informe' }).first().click();
  await expect(
    page.getByRole('button', { name: /Descargar|Imprimir|Capturar|Compartir/ }),
  ).toHaveCount(0);
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pantalla completa / Salir' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir original' })).toBeVisible();
  await page.getByRole('button', { name: 'Recargar informe' }).click();
  await expect(page.getByRole('status')).toContainText('Se solicitó recargar');
  await page.screenshot({ path: info.outputPath('portal-consulta.png') });
});
test('búsqueda de informes', async ({ page }) => {
  await page.getByRole('searchbox').fill('TRANS');
  await expect(page.getByRole('heading', { name: 'Epidemiología', exact: true })).toHaveCount(0);
  await page.getByRole('searchbox').fill('inexistente');
  await expect(page.getByRole('status')).toContainText('No se encontraron informes');
});
