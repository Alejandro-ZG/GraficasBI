# Validación del MVP

Fecha: 15 de octubre de 2026.

## Verificado

- Build de producción con base `/GraficasBI/` correcto, paquete inicial aproximado de 245 kB; jsPDF se carga bajo demanda.
- 20 pruebas unitarias aprobadas: catálogo, selección, recorte, proporciones PDF, errores de permisos, liberación de pistas, recarga, pantalla completa y búsqueda.
- 22 pruebas de navegador aprobadas en Chrome, Edge, WebKit y vistas emuladas de Pixel 7 e iPhone 13. Tres casos de MediaStream simulado se omiten fuera de Chrome/Edge, donde se ejecutan.
- Navegación, selección de TRANS, búsqueda, ausencia de desbordamiento horizontal, rechazo de imágenes corruptas, recuperación tras cancelar permisos y captura de un fotograma con fuente simulada.
- Carga de PNG de 800 x 400, recorte central a 400 x 200 y comprobación exacta de los píxeles seleccionados.
- Descargas reales de PNG y PDF; los cinco PDF generados contienen el título correcto y la imagen de 400 x 200 con el color esperado. PDF renderizado e inspeccionado visualmente.
- Preparación del PDF para impresión abre una ventana; compartir sin soporte descarga el archivo.
- Portada revisada visualmente en escritorio y vista móvil.

## Límites que requieren comprobación en el dispositivo

- El permiso y selector reales de Screen Capture API dependen del navegador y del sistema. La prueba automatizada simula la fuente y la cancelación; no demuestra la interacción del selector nativo ni el contenido de un informe real filtrado.
- Android/iPhone se probaron mediante emulación de tamaño, interacción táctil y motor. No se dispone de teléfonos físicos para certificar el menú nativo de compartir ni la captura nativa.
- No se envió ningún documento a una impresora física. Se verificó la preparación del PDF y la apertura de su ventana.
- Firefox quedó sin verificar: su ejecutable no pudo arrancar en este entorno Windows (`spawn UNKNOWN`). Se mantiene como proyecto de prueba opcional.
- Salud Ambiental está preparado como departamento sin informe, pendiente del enlace público del responsable.
- Power BI es externo: su disponibilidad, filtros, datos y caché dependen de Microsoft. La aplicación no accede al DOM del iframe ni puede forzar una actualización del modelo.

## Comprobación manual reproducible

1. Abrir el sitio por HTTPS en Chrome o Edge, seleccionar TRANS y filtrar el informe.
2. Capturar resultado, elegir la pestaña o ventana correcta en el selector nativo y comprobar la imagen.
3. Recortar y comparar PNG/PDF con el resultado visible; probar impresión y compartir.
4. Cancelar el permiso y volver a intentar; debe aparecer un mensaje y quedar disponibles los botones.
5. En Android/iOS, hacer una captura del sistema, subirla y repetir recorte y descarga; probar el menú nativo si está disponible.
