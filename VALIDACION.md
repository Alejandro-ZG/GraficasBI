# Validación del MVP

15 de octubre de 2026. Flujo actualizado: descargar imagen, descargar PDF o imprimir con delimitación automática del visor, sin editor ni confirmación de recorte.

## Verificado

- Build de producción correcto. jsPDF se descarga bajo demanda.
- Pruebas unitarias: catálogo, selección, proporciones, errores de permisos, detención de pistas, identidad de la pestaña, recarga, pantalla completa y búsqueda.
- Pruebas completas en Chrome y Edge: Screen Capture API real del navegador de pruebas, verificación de la pestaña mediante Capture Handle y extracción automática del rectángulo del iframe. PNG/PDF se descargan sin pasos intermedios; impresión genera una hoja con solo el resultado y su título/fecha.
- Se comprueban dimensiones exactas y píxeles centrales del área exportada; no debe incluir botones ni el resto de la página. Las pistas se detienen y se restaura el tamaño del visor y la posición de scroll.
- En WebKit y vistas móviles emuladas se comprueban selección de departamentos, carga y descarga de una imagen completa sin editor, rechazo de archivos corruptos y alternativa para navegadores sin captura automática.
- Las pruebas no editan ni reconstruyen el informe Power BI. El iframe se conserva al volver a la portada y se descarta la imagen previa al cambiar de informe.
- Se validó además el informe público TRANS real: filtro «15 y +», descarga PNG/PDF y estado visual filtrado.

El navegador aislado de pruebas usa la opción oficial de Chromium `--auto-accept-this-tab-capture` para aceptar la captura de su propia pestaña de prueba. Esa opción no se utiliza en el sitio publicado: cada usuario debe conceder permiso.

En GitHub Actions las pruebas se ejecutan con un escritorio virtual Xvfb y navegador con interfaz, porque la captura de pestaña no está soportada por el ejecutable headless de Chromium del runner Linux.

## Límites

- La aplicación solicita autorización y exige la pestaña exacta del portal. Si se elige otra pestaña, ventana o pantalla, detiene la captura y muestra un mensaje; no estima coordenadas de una fuente ajena.
- La exportación toma el área visible del iframe, incluidos los filtros visibles. No captura páginas internas ni contenido de Power BI que no esté visible.
- En dispositivos sin Screen Capture y Capture Handle se ofrece subir una captura del sistema. Se exporta la imagen completa, sin edición.
- Las vistas móviles emuladas no certifican el comportamiento de un teléfono físico. El diálogo nativo de impresión tampoco se envió a una impresora física.
- Firefox no pudo iniciar en este entorno Windows (`spawn UNKNOWN`); no se declara validado.
- Salud Ambiental sigue pendiente del enlace público real.
- La actualización de los datos y la caché pública dependen de Power BI.

## Prueba manual

1. Abrir por HTTPS en Chrome o Edge de escritorio y aplicar filtros en TRANS.
2. Pulsar Descargar imagen o Descargar PDF; en el selector nativo elegir la pestaña del portal.
3. Comprobar que el archivo contiene solo el visor y el estado filtrado, sin editor intermedio.
4. Repetir con Imprimir; revisar la hoja y elegir impresora o guardar como PDF.
5. Cancelar el permiso o elegir otra pestaña: debe aparecer un mensaje y quedar la interfaz disponible.
6. En móvil, desplegar Usar una captura del dispositivo, elegir acción y subir una captura reciente. La acción se ejecuta sobre la imagen completa.

## Encuadre según referencia

Se comprobó visualmente Epidemiología con el encuadre que conserva filtros, gráfico y crédito interno, eliminando las barras de zoom y navegación. La prueba del reproductor usa una franja roja inferior para confirmar que queda fuera de la imagen exportada. Se mantienen las proporciones y se ajusta la escala entre píxeles CSS y vídeo.
