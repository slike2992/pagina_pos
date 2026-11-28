# Ramas y corte web autorizado — 2026-11-28

El propietario autorizó expresamente publicar en Git los datos del proveedor
incluidos en los documentos de Cripton, NIT y dirección de notificaciones. El
commit `ece1bc5b04aad258904d52f55a4e5caf49961b0d` quedó publicado en
`codex/web-production-20261128`, la integración web y `develop`.
La publicación del código no adopta contratos ni abre servicios productivos.

| Rama | Función | Corte inicial de esta preparación |
| --- | --- | --- |
| `codex/pagina-pos-landing` | Integración del trabajo web existente | `ece1bc5b04aad258904d52f55a4e5caf49961b0d` |
| `develop` | Desarrollo integrado y preparación verificable | Mismo corte web autorizado |
| `main` | Base histórica hasta que se admita el primer release productivo | `ee017aa14446d6b77e029ac850579a1c8ec777bc` |
| `codex/web-production-20261128` | Preparación aislada y documentación del corte | Incluye ese código y las evidencias posteriores |

`main` se inicializó explícitamente en el commit raíz de Astro, sin reconstruir
historia ni sustituirlo por una versión supuestamente desplegada. **No representa
una aplicación productiva lanzada.** Su contenido inicial tampoco debe
publicarse como sitio mediante un despliegue automático. La última versión
realmente servida se determina con el manifiesto del destino y `current`.

La preparación preservó los cambios locales de `Brand.astro`, `pago/demo.astro`
y archivos no versionados del checkout principal. El fast-forward comparó diff,
índice y status antes/después; nada de ese trabajo ajeno viajó en estos commits.
No se cambiaron esos archivos ni el sitio servido en staging.

## Coordinación y próxima promoción

Antes de integrar, consultar el remoto y leer `docs/CROSS_BRANCH_CHANGES.md`;
no mezclar cambios de otros worktrees. Este repositorio no tiene instalado el
comprobador SaaS de `feature/saas-foundation`: ese nombre no es su base web.
La consulta de referencias/ancestry y la comparación de los cambios siguen
siendo explícitas; no se acredita sincronización con un comando inexistente.

CI valida staging y producción como perfiles separados, con lockfile congelado
y sin despliegue. Una candidata futura usa `release/<versión>` en ambos repos,
checkouts limpios y los SHA exactos, bajo `check-release-promotion.mjs` de SaaS.
No se ha escogido aquí una versión comercial ni creado una candidata estable.
La creación de ramas no equivale a configurar protección efectiva en GitHub.

Actualización posterior: la protección de `main` sí quedó aplicada por la API
y releída del servidor. Exige `verify-staging` y `verify-production` de GitHub
Actions, también para administradores, con historia lineal y sin force-push ni
borrado. No añade revisores ajenos ni cambia el commit de la rama, el default
branch o el sitio. [Política y alcance de la evidencia](WEB_MAIN_PROTECTION_2026-11-28.json).
No se intentó un push negativo que pudiera mover la base histórica. El registro
local de la política no sustituye una consulta futura a GitHub si cambia.

La política se comprobó en este repositorio público. No se extrapola al SaaS
privado: su plan actual rechazó esa configuración y se conserva privado, sin
contratar otro plan ni afirmar que sus hooks locales sean enforcement remoto.

Para publicar el primer producto aún se requieren el corte SaaS compatible,
evidencia operativa/admisión, Wompi productivo, copias externas/recuperación,
capacidad, DNS/HTTPS y validación real de registro, correo, contrato y POS.
Las bases, secretos, sesiones e imágenes de staging no se convierten en datos
productivos por cambiar de rama o ejecutar `astro build`.
