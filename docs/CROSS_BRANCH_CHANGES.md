# Coordinación de contratos web / SaaS

## 2026-11-25 — Contratación por empresa y seguimiento de solicitudes

- Consumidor de `pos_saas@bec4838`: GET/POST customer-contract, recibo privado y
  casos propios legal-support. API aplica la autoridad; la web no confirma pagos,
  habilitación DIAN o identidad oficial. No cambia registro, marketing o cookies.
- Reutiliza sesión de Mi cuenta, SSO, Wompi y prueba15d. Carga sólo datos declarados
  sin adjuntar identificación. Cinco consentimientos sin preselección; renovación
  recurrente permanece en su flujo independiente. JSON/constancia imprimible.
- Requiere publicación coordinada y Control035/037; no activa una versión por sí
  sola. Política inactiva/package null conserva compatibilidad; un fallo del paso
  no se convierte en aceptación ni deshabilita el acceso permitido al POS.
- Soporte/consultas/reclamos con constancia/plazos del servidor. Principal y
  tenant comprobados al leer respuestas; no comparte permisos de Control.
- No se modifican Brand.astro ni pago/demo.astro que estaban pendientes en el
  checkout principal. Nueva evidencia, límites y operación en
  `CUSTOMER_CONTRACTS_2026-11-25.md`.
- test:web438 aprobadas. Astro check/build por CLI instalado; navegador real y
  bandeja aún pendientes de reparación Windows1920. Sin despliegue ni aceptación
  productiva, con versiones/aceptaciones anteriores conservadas.
