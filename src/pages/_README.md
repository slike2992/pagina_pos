# Rutas de la web

| Grupo | Presentación y política |
| --- | --- |
| `/` | Landing comercial, planes y contacto preparado localmente. |
| `/soluciones/` y sus cuatro detalles | Recorridos informativos generados desde contenido tipado. |
| `/guias/elegir-un-pos/` | Guía de evaluación con enlaces al producto. |
| `/confianza/` | Accesos, responsabilidades y canales, sin prometer SLA o certificaciones. |
| `/legal/`, `terminos`, `privacidad`, `cookies` | Documentos vigentes y explicación de preferencias. |
| `/legal/borradores/*` | Solo desarrollo/preview explícita; noindex, excluidos de release público. |
| `/registro/*`, `/cuenta`, `/recuperar-clave`, `/pago/*` | Flujos existentes de API; noindex, sin canonical o analítica. |
| `/plataforma` | Acceso administrativo anterior conservado; noindex/nofollow. Cripton Control completo se desarrolla en otro plano. |

`EditorialLayout` provee idioma, SEO, H1, migas normalizadas, contenedor, header y
footer. Las páginas no repiten esas piezas ni cargan fuentes o librerías de UI
externas. `FlowLayout` conserva los formularios y añade el pie compartido.

Para añadir una ruta editorial: crear contenido útil y verificable, enlazarla
desde una ruta existente, añadirla a la allowlist explícita y ejecutar auditoría
del HTML y navegador. Para rutas privadas: no añadirlas a la allowlist. Noindex
no reemplaza autenticación ni protección del backend.

El formulario comercial está deshabilitado en HTML inicial y se habilita con su
controlador. Esto evita que, si falla JavaScript, los datos se envíen como query
a la portada. Existe un enlace de correo alternativo. Preparar el mensaje no
lo envía; el destino con el contenido se conserva en memoria, fuera de atributos href; editarlo oculta el botón anterior para no abrir datos desactualizados.
