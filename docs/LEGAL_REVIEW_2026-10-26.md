# Revisión legal Cripton — 2026-10-26

**Estado: BORRADORES PARA REVISIÓN. Sin vigencia, sin nuevas aceptaciones y sin publicación de versiones legales.**

Aviso que aparece en cada página: «Borrador para revisión. No modifica las condiciones aceptadas ni se utiliza para registrar cuentas.».

## Alcance y evidencia

Se leyeron AGENTS.md y README del sitio, src/pages/legal/terminos.astro, privacidad.astro y registro/index.astro. Los textos publicados se identifican como versión 2026-09-01. El registro obtiene términos y privacidad desde GET /v1/public/legal-documents, enlaza contentUrl y envía termsVersion, privacyVersion y acceptedAt al crear el intento. Una casilla conjunta no acredita por sí sola una autorización diferenciada de datos ni cobros recurrentes.

Solo se intervienen estos tres archivos: src/content/legal-drafts.ts, src/pages/legal/borradores/[document].astro y este informe. El archivo de contenido ya contenía dos propuestas incompletas: se conserva y completa su desarrollo con el anexo y ajustes de precisión. No se modifican registro, backend, catálogo público, SQL, condiciones vigentes ni archivos de otros especialistas.

La versión 2026-09-01 sigue siendo la referencia contractual informada por la API según el encargo. No se consultó ni alteró una base productiva. scripts/legal-content-baseline.json, preparado por el integrador, identifica hashes del article fuente; **no son ni reemplazan hashes legales de la base de datos**. La preservación del article y la validez de las aceptaciones deben seguir verificándose de manera independiente.

Se intentó npm run sync:check en la raíz del sitio: no existe ese script. Tampoco se encontró el comprobador alterno en el git-common-dir de este repositorio independiente. No se afirma sincronización remota ni se hizo commit. El README del sitio tiene afirmaciones históricas sobre ausencia de persistencia y backend que no describen completamente el registro actual; su actualización corresponde al integrador, fuera de estos tres archivos.

Los hechos técnicos sobre Factus, Wompi y Microsoft proceden del alcance facilitado y del código local leído. No se auditaron contratos de esos proveedores ni sus términos; no se consultaron fuentes externas ajenas a las cuatro entidades autorizadas. La revisión no certifica cumplimiento, habilitación fiscal, controles productivos ni disponibilidad.

## Fuentes oficiales consultadas

Consulta: 2026-10-26. Las normas se interpretan conjuntamente con sus modificaciones. Los conceptos orientadores no equivalen a una decisión sobre Cripton. Algunos accesos HTML de Función Pública fallaron; se contrastaron los extractos oficiales indexados con el texto accesible de MinCIT cuando estuvo disponible.

| Fuente oficial | Materia y uso en los borradores |
| --- | --- |
| [Función Pública — Ley 1581 de 2012](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981) | Arts. 3–4: roles y principios; 5–7: categorías especiales; 8–13: derechos, autorización e información; 14–16: consultas, reclamos y trámite previo; 17–18: deberes de responsable y encargado; 26: transferencias. |
| [MinCIT — Decreto 1074 de 2015, texto oficial](https://www.mincit.gov.co/ministerio/normograma-sig/procesos-de-apoyo/gestion-juridica/decretos/decreto-1074-de-2015-8.aspx) y [compilación de Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608) | Capítulo 25: autorización, limitación temporal, política y aviso; arts. 2.2.2.25.3.1, 4.4, 5.1–5.2 y 6.1: contenido mínimo, área a cargo, transmisión internacional, contrato de transmisión y responsabilidad demostrada. El PDF original no se toma como compilación íntegra de reformas posteriores. |
| [SIC — Políticas de tratamiento de datos personales](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/politicas-de-tratamiento-de-datos-personales) | Diferencia entre política y aviso; contenido mínimo. Una política no necesita una certificación que sustituya su cumplimiento material. |
| [MinCIT — Ley 1480 de 2011](https://www.mincit.gov.co/ministerio/normograma-sig/procesos-misionales/facilitacion-del-comercio-y-defensa-comercial/leyes/ley-1480-de-2011.aspx) | Arts. 4–5, 23, 29, 37–43, 47 y 49–51: consumidor según finalidad, información, condiciones de adhesión, límites a cláusulas abusivas, retracto y comercio electrónico. Debe leerse con reformas posteriores. |
| [Función Pública — Ley 2439 de 2024](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=257116) | Modifica devolución por retracto y deberes de comercio electrónico. Importan la trazabilidad de PQR, información de entrega y actualización del plazo aplicable de devolución; no se reutiliza sin revisión el texto original de 2011. |
| [SIC — Cláusulas abusivas y derechos](https://www.sic.gov.co/noticias/rnpc/como-reconocer-las-clausulas-abusivas-y-proteger-sus-derechos) | Apoyo orientador para evitar obstáculos a terminación, renuncias y desequilibrios injustificados. El supuesto B2B no resuelve por sí solo si hay consumidor. |
| [SIC — Enlace a la autoridad en comercio electrónico](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/titulo-obligacion-de-incluir-enlace-la-superindustria-en-plataformas-de-comercio-electronico) | Revisar enlace visible a la SIC en el flujo comercial cuando sea aplicable. No implica afiliación ni aval de la entidad. |
| [DNDA — Software](https://www.derechodeautor.gov.co/es/otros/software) y [preguntas frecuentes, transferencia de derechos](https://www.derechodeautor.gov.co/es/transparencia-y-acceso-informacion-publica/informacion-de-la-entidad/116-preguntas-y-respuestas-frecuentes/preguntas-y-respuestas-frecuentes) | Protección del software y carácter declarativo del registro; distinguir licencia de uso de cesión. Pendiente acreditar cadena de titularidad y licencias de terceros. No se afirma registro ante DNDA. |

## Propuestas y límites

- **Términos:** contratación informada, alcance del plan, licencia de acceso temporal y no exclusiva, cuentas, pago, renovación, cancelación, salida, soporte, confidencialidad y responsabilidad imputable. Se acota al alcance y daños legalmente atribuibles, sin imponer un tope económico arbitrario ni excluir dolo, culpa grave u obligaciones irrenunciables.
- **Privacidad:** operador responsable sobre cuenta y relación propia; comercio responsable y Cripton encargado sobre operación del POS. Autorización de datos, publicidad, aceptación contractual y débito automático tienen objetos distintos. Se detallan derechos, consultas y reclamos con sus términos legales.
- **Tratamiento por cuenta del cliente:** propuesta de anexo de transmisión con objeto, instrucciones, operaciones, titulares, datos, seguridad, terceros, ubicaciones, asistencia, incidentes, evidencia y salida. Requiere identificar y vincular a las partes y completar anexos operativos.

Los textos son propuestas completas para revisión en los asuntos definidos, pero los pendientes impiden tratarlos como condiciones listas para contratar. No se inventan razón social, NIT, dirección, porcentaje de disponibilidad, tiempos de soporte, retención uniforme, certificaciones ni garantías de validación fiscal.

## Brechas reales y decisiones pendientes

| Evidencia o límite observado | Decisión / validación necesaria antes de adoptar |
| --- | --- |
| Los textos actuales nombran el producto sin individualizar al operador legal. | Titular: nombre o razón social, identificación/NIT según corresponda, domicilio, dirección, teléfono, representación y área de privacidad. No completar por inferencia desde el dominio. |
| Hay un correo legal en el texto, sin evidencia de recepción o seguimiento en esta revisión. | Verificar atención, constancia y radicado, horarios del soporte y canales accesibles de PQR, privacidad, cobro y cancelación. |
| Los términos actuales no concretan renovación, efectos de cancelar, salida ni reembolsos. | Producto/negocio: periodo, total e impuestos, cuotas FE, excedentes, cambios de plan y precio, autorización de recurrencia, fecha de corte, acceso pagado y saldos. Cancelar renovación no equivale a borrar datos. |
| El formulario agrupa términos y privacidad. | Jurídico/producto: texto y evidencia de autorización previa e informada de datos propios; opciones separadas para publicidad y cobro recurrente si existen. Revisar excepción legal por finalidad: el contrato no es dispensa general de autorización en Colombia. |
| La privacidad actual agrupa cuenta y operación del comercio. | Inventario de categorías, finalidades, fuente, receptor y rol; política del comercio e instrucciones documentadas. El anexo no autoriza usos propios de datos operativos. |
| El registro guarda datos y evidencia del intento en sessionStorage. | Inventariar contenido, expiración/limpieza, accesos y proveedores de navegación. Revisar también cookies y preferencias implementadas por compañeros; esta tarea no las audita. |
| No hay evidencia aquí de contratos, roles y países de todos los receptores. | Identificar entidades de Wompi, Microsoft, Factus e infraestructura; revisar contratos, proveedores posteriores, ubicaciones y mecanismos de transferencia o transmisión. No asumir que todos son encargados. |
| Factus es integración fiscal por tenant/emisor/ambiente según el encargo. | Confirmar cuotas, credenciales, origen de documentos, separación de prueba/producción, contingencia y escalamiento. No confundir compra del plan FE con habilitación del emisor ni con validación garantizada. |
| El texto actual afirma ausencia de datos completos de tarjeta sin auditoría de este bloque. | Verificar formularios, tránsito, logs y soporte antes de repetir esa afirmación en una política nueva. Wompi tiene sus propias autorizaciones; no sustituyen las del servicio. |
| La documentación actual menciona conservación sin criterios operativos concretos. | Aprobar matriz por cuenta incompleta, relación comercial, operación, soporte, auditoría y respaldos; motivo, fundamento, duración, bloqueo, supresión, responsable y evidencia. No extrapolar un plazo fiscal a toda información. |
| Exportación, recuperación, supresión e incidentes no se probaron de extremo a extremo. | Validar formatos, canal seguro, solicitantes, ventana de salida, respaldos, restauración sin reintroducción de datos suprimidos y reportes legales. Acordar coordinación interna sin inventar un plazo universal de incidentes. |
| No hay evidencia de cadena de derechos del software ni compromisos medidos de servicio. | Acreditar titularidad/autorizaciones y licencias; aprobar soporte y compromisos solo si existen medios para cumplirlos. Revisar responsabilidad y cualquier límite futuro según ley y tipo de relación. |

Responsables propuestos para cerrar decisiones: titular/representante legal y asesoría jurídica; negocio para condiciones comerciales; responsables de producto/seguridad/operación para evidencias técnicas. Son tareas pendientes, no aprobaciones ya obtenidas. Evaluar también aplicabilidad del RNBD según el operador real, sin afirmar inscripción ni exención.

## Preview y barrera de publicación

Rutas: /legal/borradores/terminos/, /legal/borradores/privacidad/ y /legal/borradores/tratamiento-por-cuenta-del-cliente/.

getStaticPaths solo devuelve esos tres slugs. La fecha 2026-10-26 identifica una revisión, no una versión activa de la API.

| Entorno | PUBLIC_SITE_INDEXABLE | PUBLIC_LEGAL_DRAFT_PREVIEW | Resultado |
| --- | --- | --- | --- |
| Desarrollo (import.meta.env.DEV) | cualquiera | ausente/false | Tres rutas para revisión local, noindex. |
| Build productivo normal | false/ausente | false/ausente | Ninguna ruta de borrador. |
| Build productivo indexable | true | false/ausente | Ninguna ruta de borrador. |
| Build de preview | false/ausente | true | Tres rutas, noindex; usar despliegue de revisión con acceso restringido. |
| Build productivo indexable | true | true | Error explícito; detener release. |

Para preview local se puede usar el servidor de desarrollo existente. Si hace falta uno nuevo, seguir AGENTS.md: npm run dev -- --background. Para un artefacto de revisión, en PowerShell establecer PUBLIC_LEGAL_DRAFT_PREVIEW='true' y PUBLIC_SITE_INDEXABLE='false' antes de npm run build; después limpiar esas variables o restaurar sus valores anteriores. No desplegar ese artefacto como release público. Los valores se evalúan al compilar; cambiar variables en un hosting estático no retira páginas ya generadas.

La página usa EditorialLayout con noindex=true. El sitemap existente funciona por allowlist y no incluye /legal/borradores/. Noindex no es control de acceso: un preview que se aloje debe restringirse por el mecanismo del entorno. Para release, compilar desde salida limpia, verificar que no queden HTML ni assets de borradores y desplegar con reemplazo que retire archivos antiguos; no reutilizar un dist de preview ni dejarlo en CDN. Esta tarea no cambia hosting, robots, allowlist ni pipeline.

## Ruta futura de snapshots y migración canónica — no implementada

1. Congelar los contenidos que se presentaron con 2026-09-01 como snapshots inmutables y accesibles por versión. Reconciliar contenido efectivamente servido, repositorio y catálogo antes de inferir qué se aceptó; guardar incertidumbres históricas. Preservar versiones, aceptaciones, fechas y hashes existentes.
2. Definir representación canónica estable del documento jurídico (por ejemplo contenido UTF-8 aprobado, sin componentes dinámicos), reglas de serialización, tipo, versión, URL inmutable y SHA256 de **esos bytes**. Conservar también el snapshot servido. El hash de article fuente del baseline tiene otra finalidad y no puede sustituir a un digest de DB.
3. Si un hash histórico no representa los bytes recuperados, registrar evidencia y una reconciliación adicional trazable. No recalcularlo en sitio ni afirmar retrospectivamente que el nuevo hash fue el aceptado. No cambiar checksums publicados de migraciones.
4. Preparar y revisar una nueva migración aditiva en database/control/migrations del repositorio SaaS, con tipo/versión/digest/snapshot referenciables, integridad y unicidad definidas. No aplicar SQL manual ni tocar otras bases. Solo usar database/pos/migrations si una necesidad operativa real lo requiere, ajena a este bloque.
5. Mantener compatibilidad del GET /v1/public/legal-documents y del payload de alta hasta aprobar los cambios de contrato. El tercer anexo necesita decisión sobre partes, tenant, facultades y evidencia de vinculación; no inventar ahora un tipo HTTP nuevo ni meterlo en termsVersion/privacyVersion.
6. Crear nuevas versiones únicamente tras cierre jurídico y operativo, comunicar cambios y obtener aceptación/autorización cuando corresponda. Las aceptaciones anteriores deben seguir apuntando al contenido anterior. No modificar la URL vigente para servir un texto diferente bajo la misma versión.
7. Validar snapshots y SHA256, lectura histórica, activación atómica, reintentos de alta ante cambio de catálogo, permisos de activación y reversión de catálogo sin pérdida de historia. Documentar cambio y consumidores en docs/CROSS_BRANCH_CHANGES.md del SaaS en ese futuro commit. Este bloque no modifica ese repositorio ni publica una versión nueva.

## Comprobaciones de este bloque

Ejecutadas con Node 24.19.0 y las dependencias ya instaladas, sin instalar paquetes ni reiniciar servicios existentes:

- TypeScript estricto del módulo de contenido sin errores y transformación de la ruta con el compilador Astro instalado, sin errores.
- Matriz de getStaticPaths ejecutada sobre la función del archivo: desarrollo 3 rutas; producción normal 0; producción indexable 0; preview explícito 3; producción indexable con preview rechazada con mensaje claro. En desarrollo los indicadores no convierten el servidor en un release.
- Builds reales en una copia temporal de src/public/configuración, con las mismas dependencias: preview correcto con tres HTML; release indexable correcto sin rutas de borrador; combinación insegura rechazada por el error previsto. Se verificó ausencia de contenido del aviso en todos los HTML del release.
- Sitemap renderizado sin /legal/borradores/ en preview y release. Los tres HTML de preview contienen noindex, follow, no tienen canonical y muestran el aviso requerido. No se modificó la allowlist.
- Navegador Edge sin interfaz visible sobre el artefacto temporal: las tres rutas respondieron 200, tienen 13 secciones cada una, enlaces de contenido a anchors existentes y navegables, sin formulario de aceptación dentro del contenido. Comprobadas a 1440 px y 390 px; sin desbordamiento horizontal a 390 px ni errores JavaScript en esos recorridos. Se inspeccionaron capturas del aviso inicial en escritorio y móvil.
- Articles de términos y privacidad 2026-09-01 comparados con scripts/legal-content-baseline.json mediante SHA256: coincidencia exacta. Esto verifica preservación del article fuente, no hashes de DB ni toda la historia contractual.
- Sin commit, migraciones, modificaciones de backend, envío de correo, cobro ni despliegue. Las salidas y capturas de comprobación quedaron en una carpeta temporal del sistema, no en archivos de compañeros.

Límites: no es una prueba completa del registro, pagos, correo, FE, ejercicio de derechos o recuperación productiva; tampoco una auditoría de seguridad o dictamen jurídico. Los builds corresponden a la copia temporal tomada para esta validación; el trabajo concurrente del sitio requiere su control final de integración. La exclusión efectiva en hosting también exige retirar cualquier artefacto previo de preview, según la sección de publicación.
