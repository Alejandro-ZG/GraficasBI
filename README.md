# Portal de Indicadores de Salud

Aplicación pública Angular 22 standalone + TypeScript + Tailwind 4. Sin backend, autenticación ni servicios de pago. Los informes mantienen sus filtros originales dentro de Power BI. Las capturas se procesan en memoria del navegador.

## Informes

- Epidemiología: Gráficas y Canal.
- TRANS: Trans_PuertoCortés.
- Salud Ambiental: sección preparada, pendiente del enlace público real.

El catálogo está en `src/app/catalog.ts`. Para agregar un informe, incluir su identificador, título, descripción y `publicEmbedUrl` en el departamento correspondiente. Solo se permiten URLs HTTPS `app.powerbi.com/view?r=...`; no se aceptan enlaces introducidos por visitantes.

## Instalación y ejecución

Requiere Node.js 24 y npm.

```sh
npm ci
npm start
```

Abrir http://localhost:4200. Verificación:

```sh
npm run build
npm test -- --watch=false
npx playwright install chromium webkit
npm run test:e2e
```

Las pruebas locales de escritorio usan Chrome y Edge instalados; en Linux/CI se debe usar Chromium. Firefox es opcional mediante `TEST_FIREFOX=1` y requiere `npx playwright install firefox`. En este entorno Windows Firefox no pudo iniciarse (`spawn UNKNOWN`), por lo que no se declara verificado.

## Uso

1. Buscar y seleccionar un informe desde la portada.
2. Aplicar filtros dentro de Power BI. Pantalla completa / Salir amplía el visor; Escape permite salir.
3. Capturar resultado abre el selector nativo de pantalla, ventana o pestaña donde la API esté disponible. Elegir la superficie del informe y comprobar que lo necesario esté visible.
4. En móvil o si no se permite captura directa, usar una captura del sistema y Subir captura. Límite: 20 MB y 40 megapíxeles.
5. Ajustar izquierda, arriba, ancho y alto del recorte en porcentajes. Confirmar y revisar la imagen.
6. Descargar PNG/PDF, preparar impresión o compartir PNG/PDF. Si compartir no está disponible o falla, se ofrece descarga local.

Las pistas de pantalla se detienen al terminar el fotograma, también ante errores. No se usa html2canvas para leer el iframe. PNG conserva los píxeles del recorte; PDF añade título, departamento, fecha y advertencia estática, sin deformar la imagen. El enlace público no conserva el estado interactivo de filtros.

Volver al inicio mantiene el visor montado para conservar sus filtros. Cambiar de informe o recargarlo puede reiniciarlos. Cambiar de informe descarta la captura anterior para evitar confundir sus títulos. Capturas e imágenes no se envían a servidores ni se guardan de forma persistente.

## Estructura

- `app.ts` / `app.html`: portada, catálogo, selección y coordinación de la sesión.
- `report-viewer.ts`: iframe validado, recarga y pantalla completa.
- `capture.service.ts`: Screen Capture API, lectura de imágenes y recorte.
- `export.service.ts`: PNG, PDF bajo demanda, compartir y descarga alternativa.
- `catalog.ts`: departamentos e informes públicos.
- `e2e/portal.test.ts`: pruebas completas con imágenes y fuente de pantalla simuladas.
- `.github/workflows/deploy.yml`: build, pruebas y despliegue a GitHub Pages.

## Publicación en GitHub Pages

Repositorio de destino: https://github.com/Alejandro-ZG/GraficasBI

En Settings > Pages seleccionar GitHub Actions. Ejecutar el workflow Publicar portal en GitHub Pages desde Actions. La compilación ajusta base-href al nombre del repositorio; en un repositorio `usuario.github.io` usa `/`. No hay rutas profundas que requieran reglas del servidor. Para dominio propio, ajustar base-href a `/`.

El workflow puede ejecutarse manualmente y con cada push a main. Una actualización de los informes de Power BI no requiere desplegar de nuevo el portal salvo que cambie el enlace público.

## Compatibilidad y evidencia

Consultar `VALIDACION.md` para resultados y límites. Las pruebas con vistas móviles emuladas no equivalen a una prueba en teléfonos físicos. El selector nativo de permisos y el menú nativo de compartir requieren validación en el dispositivo del usuario. La aplicación ofrece alternativas sin bloquear el flujo.

El portal no puede confirmar si los visuales del iframe terminaron de cargar porque pertenecen a otro origen. El evento load confirma navegación del iframe, no que el informe sea válido. Si tarda o falla, se puede recargar o abrir el original.

Si el informe privado está actualizado pero el público no, revisar que el código público corresponda al mismo informe. Power BI mantiene caché de publicación pública; recargar el iframe no fuerza refresh del modelo ni invalida esa caché.

## Referencias oficiales

- https://angular.dev/installation
- https://tailwindcss.com/docs/installation/framework-guides/angular
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-publish-to-web
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
