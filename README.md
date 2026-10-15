# Portal de Indicadores de Salud

Sitio: https://alejandro-zg.github.io/GraficasBI/

Angular 22 standalone, TypeScript y Tailwind 4. Sin backend, autenticación ni servicios de pago. Informes públicos de Epidemiología (Gráficas y Canal) y TRANS (Trans_PuertoCortés). Salud Ambiental queda preparado, pendiente de su enlace público.

## Ejecutar y verificar

Requiere Node.js 24 y npm.

```sh
npm ci
npm start
npm run build
npm test -- --watch=false
npx playwright install chromium webkit
npm run test:e2e
```

En local: http://localhost:4200. Las pruebas de escritorio usan Chrome y Edge instalados; en CI usan Chromium. Firefox es opcional con TEST_FIREFOX=1 y requiere su navegador Playwright.

## Exportar el estado actual

1. Entrar al departamento y aplicar filtros dentro del informe.
2. Pulsar Descargar imagen, Descargar PDF o Imprimir.
3. Autorizar la captura y elegir la pestaña de este portal.
4. El portal toma una imagen nueva, delimita automáticamente el iframe y ejecuta la acción elegida. No se abre ningún editor ni se pide confirmar un recorte.

La captura usa Screen Capture API. Capture Handle permite comprobar que la fuente es exactamente la pestaña del portal; solo entonces se usan los límites exteriores del iframe y la escala del vídeo para extraer sus píxeles. No se accede al DOM de Power BI ni se usa html2canvas para leer el iframe. Las pistas se detienen inmediatamente después del fotograma. Todo se procesa en memoria local.

Para encuadrar el visor se ajusta temporalmente su alto al espacio de la ventana, sin recargar el iframe ni modificar sus filtros, y después se restaura. Se exporta lo visible dentro del visor, no páginas internas o contenido fuera de su scroll.

Si el navegador no admite captura automática, desplegar Usar una captura del dispositivo, elegir la acción y subir una captura reciente. La acción se ejecuta con la imagen completa, sin edición. Límite: 20 MB y 40 megapíxeles.

PNG mantiene el contenido capturado; PDF incorpora título, departamento y fecha conservando proporciones. Imprimir abre el diálogo del navegador con una hoja que contiene únicamente título, fecha y la imagen del resultado. El enlace público no conserva filtros interactivamente.

## Catálogo y navegación

`src/app/catalog.ts` contiene departamentos e informes. Solo se permiten URLs HTTPS `app.powerbi.com/view?r=...` configuradas por el proyecto. Dentro de cada departamento se muestran exclusivamente sus informes; para cambiar de departamento se vuelve a la portada. Volver al inicio mantiene montado el visor para conservar filtros. Cambiar de informe o recargar puede reiniciarlos.

## Estructura

- `app.ts` y `app.html`: portada, selección y coordinación de la exportación.
- `report-viewer.ts`: iframe, botones de descarga/impresión, recarga y pantalla completa.
- `capture.service.ts`: permiso de pantalla, identificación de la pestaña y delimitación automática.
- `export.service.ts`: PNG, PDF bajo demanda y hoja de impresión.
- `catalog.ts`: configuración de departamentos e informes.
- `e2e/portal.test.ts`: pruebas completas, incluida captura real del navegador aislado.
- `VALIDACION.md`: evidencia y límites de compatibilidad.

## Publicación

Repositorio: https://github.com/Alejandro-ZG/GraficasBI

Cada push a main ejecuta pruebas unitarias, pruebas de navegador, build con base-href `/GraficasBI/` y despliegue en GitHub Pages. También puede ejecutarse manualmente desde Actions. En Settings > Pages está seleccionado GitHub Actions. Para un dominio propio, ajustar base-href a `/`.

La actualización de los datos de Power BI no requiere desplegar el portal si el enlace público no cambia. Recargar el iframe no fuerza la actualización de la caché de Microsoft.

## Referencias

- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
- https://developer.chrome.com/docs/web-platform/capture-handle/
- https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-publish-to-web
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
