# Portal de Indicadores de Salud

Sitio: https://alejandro-zg.github.io/GraficasBI/

Portal público de consulta con Angular, TypeScript y Tailwind. Incluye informes interactivos de Power BI de Epidemiología y TRANS, búsqueda, navegación por departamento, recarga y pantalla completa donde el navegador lo permita. Salud Ambiental está pendiente de su enlace público.

Las funciones de captura, carga de imágenes, descarga, PDF e impresión del portal se retiraron por decisión del responsable del proyecto. Se conservan los controles originales de Power BI dentro del iframe.

## Ejecutar

Requiere Node.js 24 y npm.

```sh
npm ci
npm start
npm run build
npm test -- --watch=false
npx playwright install chromium webkit
npm run test:e2e
```

Abrir http://localhost:4200. Las pruebas locales usan Chrome y Edge instalados, además de WebKit y vistas móviles emuladas. En CI usan Chromium y WebKit.

## Configuración

El catálogo está en src/app/catalog.ts. Cada departamento contiene sus propios informes. Solo se aceptan URLs HTTPS app.powerbi.com/view configuradas por el proyecto. Volver a la portada mantiene el iframe activo; cambiar de informe o recargarlo puede reiniciar sus filtros.

## Publicación

Repositorio: https://github.com/Alejandro-ZG/GraficasBI

Cada push a main ejecuta pruebas y build y publica mediante GitHub Actions en GitHub Pages con base-href /GraficasBI/. No hay backend, base de datos ni credenciales de Microsoft en el frontend.

La disponibilidad, la interactividad, los datos y la caché de los informes corresponden a Power BI. El portal no puede forzar su actualización.
