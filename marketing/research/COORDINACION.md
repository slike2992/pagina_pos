# Coordinación entre marketing, web y SaaS

Marketing vive en el mismo Git que la web, en `marketing/`; SaaS es otro Git. `tools/check-context.mjs` consulta por separado las ramas publicadas `codex/pagina-pos-landing` y `feature/saas-foundation`, compara sus SHA con el baseline revisado y muestra archivos afectados. No cambia ramas, hooks, índices, migraciones, código ni archivos del producto. Fetch sólo actualiza referencias remotas. El modo `--offline` es diagnóstico local y no certifica novedades remotas.

El script descubre la carpeta original web mediante su git-common-dir y usa `pos_saas` como repositorio hermano; `CRIPTON_SAAS_REPO` permite indicar otra ruta. Limpia variables Git heredadas al consultar esos repositorios para no confundir el índice de este worktree con otro. No integra historias distintas.

Si aparece un cambio, leer el diff, contrato y entrada transversal SaaS. Si afecta precio, capacidad, FE, registro, pagos, correo o diseño compartido, revisar las piezas implicadas y registrar qué cambió antes de actualizar el SHA. Nunca actualizar el baseline sólo para silenciar el control. Si falta red, continuar copys independientes dejando constancia; antes de publicar o certificar un commit, resolver el control remoto.

No se instaló ni sustituyó hook global. Las instrucciones `marketing/AGENTS.md` hacen obligatorio el control para el trabajo de este módulo; esto no es una política remota de GitHub ni memoria compartida instantánea entre chats. El frente SaaS conserva su comprobador propio. Para un nuevo colaborador: leer README, AGENTS, manual y este protocolo.

Antes de editar UI web, coordinar con su frente de diseño. Marketing solicita una capacidad por contrato cuando la necesita y conserva las piezas en borrador si no está acreditada. Nada de este kit cambia la disponibilidad del producto.
