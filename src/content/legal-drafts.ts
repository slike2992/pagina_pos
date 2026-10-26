/** Review material only. Never import into signup or the active legal catalog. */
export const legalDraftVersion = '2026-10-26';
export const legalDraftNotice = 'Borrador para revisión. No modifica las condiciones aceptadas ni se utiliza para registrar cuentas.';

export type LegalDraftSlug = 'terminos' | 'privacidad' | 'tratamiento-por-cuenta-del-cliente';
export type LegalDraftSection = {
  id: string;
  heading: string;
  paragraphs: readonly string[];
  items?: readonly string[];
  subsections?: readonly { heading: string; paragraphs: readonly string[] }[];
};
export type LegalDraft = {
  slug: LegalDraftSlug;
  title: string;
  description: string;
  lead: string;
  pending: readonly string[];
  sections: readonly LegalDraftSection[];
};

export const legalDrafts: readonly LegalDraft[] = [
  {
    slug: 'terminos',
    title: 'Términos del servicio — borrador',
    description: 'Propuesta de condiciones del SaaS POS Cripton, pendiente de identificación del proveedor y aprobación.',
    lead: 'Propuesta contractual para ventas, inventario, caja y las integraciones habilitadas en el plan del comercio.',
    pending: [
      'Identificar al proveedor: nombre o razón social, identificación o NIT, domicilio, dirección, teléfono y canales verificados. Cripton es el nombre del producto y no identifica por sí solo a la parte contractual.',
      'Aprobar precio e impuestos, duración, renovación, cancelación, reembolsos, soporte y condiciones de entrega. No hay SLA ni porcentaje de disponibilidad aprobado.',
      'Definir exportación, conservación y supresión al finalizar; revisar contratos de terceros y acreditar los derechos necesarios para ofrecer el software.'
    ],
    sections: [
      {
        id: 'partes-y-contratacion', heading: '1. Partes y contratación',
        paragraphs: [
          'La versión definitiva identificará al proveedor que ofrece Cripton y al comercio contratante. Quien actúe por una empresa deberá contar con facultades suficientes y suministrar información veraz y actualizada. Los usuarios autorizados no se convierten automáticamente en contratantes.',
          'Antes de contratar se mostrarán el plan, sus prestaciones y límites, el precio total, los impuestos y cargos, el periodo y las condiciones de activación. Se conservará la versión aceptada y el pedido. Este borrador no permite contratar ni sustituye una aceptación anterior.'
        ]
      },
      {
        id: 'alcance-del-servicio', heading: '2. Servicio y límites del plan',
        paragraphs: [
          'Cripton se ofrece como acceso web para gestionar ventas, inventario y caja, con usuarios y permisos dentro del espacio del comercio, denominado tenant. Las funciones, cuotas y sucursales serán las incluidas en el plan y las condiciones particulares aceptadas.',
          'El acceso no transfiere el código fuente ni incluye desarrollos, migraciones, equipos o asesoría contable o tributaria salvo acuerdo expreso. Las descripciones comerciales deben corresponder a funciones disponibles; una función en preparación no se entenderá incluida por aparecer en una demostración.',
          'El acceso depende de la verificación de la cuenta, la confirmación del pago y el aprovisionamiento. El plazo de entrega debe informarse antes del pago. Una simulación no acredita dinero recibido ni habilitación productiva.'
        ]
      },
      {
        id: 'cuentas-y-uso', heading: '3. Cuentas, permisos y uso permitido',
        paragraphs: ['El comercio administrará sus usuarios y retirará los accesos que dejen de ser pertinentes. Cada usuario protegerá sus credenciales y comunicará accesos sospechosos. El proveedor aplicará los controles de acceso y aislamiento que le corresponden; las obligaciones del comercio no eliminan las propias del proveedor.'],
        items: [
          'Usar el servicio para actividades lícitas y aportar información cuyo tratamiento esté permitido.',
          'No acceder a otro tenant, eludir permisos, introducir código malicioso o interferir con la operación.',
          'No compartir accesos de administración de plataforma con usuarios del negocio ni usar datos reales en pruebas sin justificación y protección adecuadas.'
        ]
      },
      {
        id: 'facturacion-electronica', heading: '4. Facturación electrónica mediante Factus',
        paragraphs: [
          'Un plan con facturación electrónica habilita una capacidad comercial. Emitir requiere además configuración técnica, credenciales autorizadas, emisor, rangos y habilitaciones aplicables. Contratar ese plan no equivale a obtener autorización fiscal ni garantiza la validación de cada documento.',
          'El comercio revisará sus datos fiscales y sus operaciones. El proveedor responderá por las tareas de integración y prestación que asuma; no trasladará al comercio las consecuencias de sus errores mediante una exclusión general.',
          'Prueba y producción se distinguen por tenant, emisor y ambiente fiscal. Un documento de prueba no tiene el mismo efecto que uno productivo. Las consultas, correcciones y reintentos respetarán el origen del documento; cambiar una configuración no convierte documentos anteriores.',
          'Ante indisponibilidad o rechazo se informará el estado conocido y se tramitará el incidente. La contingencia y el escalamiento deberán aprobarse antes de ofrecer emisión productiva. No se promete validación inmediata o permanente por Factus u otra autoridad.'
        ]
      },
      {
        id: 'precio-y-pagos', heading: '5. Precio, Wompi y renovación',
        paragraphs: [
          'El resumen previo al pago identificará periodo, total, impuestos y cargos adicionales. Las cuotas y el tratamiento de excedentes deben estar definidos. Los cambios de precio o plan se comunicarán con sus efectos y fecha de aplicación antes de ser exigibles, respetando lo contratado y la ley.',
          'Wompi interviene en el pago de la suscripción según el medio elegido. La confirmación y conciliación determinan el estado de la operación; regresar a la página no demuestra por sí solo aprobación.',
          'El cobro recurrente requiere autorización específica y comprobable, con importe o regla de cálculo, periodicidad, revocación y efectos de cancelar. Aceptar los términos o la política de privacidad no autoriza por sí solo débitos automáticos. Las aceptaciones propias de Wompi son adicionales a las del servicio.'
        ]
      },
      {
        id: 'soporte-y-continuidad', heading: '6. Soporte y continuidad',
        paragraphs: [
          'La versión definitiva identificará canales, horarios, alcance del soporte y comunicación de incidentes y mantenimientos. No se fijan tiempos de respuesta, solución o recuperación ni disponibilidad sin capacidad operativa y compromiso aprobados.',
          'El proveedor deberá adoptar medidas razonables y verificables de seguridad, respaldo y recuperación acordes con el servicio y sus riesgos. Los compromisos describirán qué información cubren y sus límites. Un ensayo local no demuestra una política de copias productivas.',
          'Los correos transaccionales pueden utilizar Microsoft 365. La aceptación del mensaje por el transporte no confirma entrega o lectura. El proveedor gestionará fallos conocidos y ofrecerá el mecanismo de atención aprobado para verificar el estado de la cuenta.'
        ]
      },
      {
        id: 'datos-y-confidencialidad', heading: '7. Datos y confidencialidad',
        paragraphs: [
          'El proveedor es responsable del tratamiento cuando decide finalidades para administrar cuentas, la relación comercial y la seguridad propia. Sobre datos personales operativos del comercio actuará como encargado cuando los trate por su cuenta e instrucciones, conforme al anexo de tratamiento.',
          'El comercio conserva sus facultades sobre su información y respetará los derechos de los titulares. Alojar registros no transfiere su propiedad al proveedor ni autoriza publicidad, venta de bases o usos ajenos al servicio.',
          'Las partes protegerán la información confidencial y limitarán su uso al propósito autorizado. El deber subsistirá mientras conserve ese carácter, sin impedir entregas exigidas por ley ni el ejercicio de derechos.'
        ]
      },
      {
        id: 'propiedad-intelectual', heading: '8. Software y propiedad intelectual',
        paragraphs: [
          'El software, las marcas y los componentes pertenecen a sus respectivos titulares. El proveedor acreditará los derechos o autorizaciones necesarios para ofrecerlos. El pago otorga una licencia de acceso limitada, no exclusiva y no transferible, para el comercio y sus usuarios autorizados durante el periodo y alcance contratado, sin cesión de derechos patrimoniales ni entrega del código fuente. No autoriza revender el servicio; las excepciones legales y licencias de terceros se respetan.',
          'Las restricciones de copia, distribución o explotación respetarán las excepciones legales y las licencias de terceros. No se exige renunciar a los derechos sobre datos o contenidos propios.'
        ]
      },
      {
        id: 'suspension-y-terminacion', heading: '9. Suspensión, cancelación y terminación',
        paragraphs: [
          'Las causas de restricción deberán ser objetivas, como incumplimiento de pago, riesgos de seguridad o usos ilícitos acreditados. La medida se limitará a lo necesario. Se informará la causa y el mecanismo de atención y, cuando proceda, la oportunidad de corregir; una urgencia de seguridad o una orden legal pueden exigir actuación inmediata.',
          'La versión definitiva indicará cómo cancelar la renovación, cuándo termina el acceso y qué ocurre con periodos pagados, saldos y cobros pendientes. No se propone cierre arbitrario ni pérdida automática de toda información por falta de pago.',
          'Suspender acceso, terminar el contrato y suprimir datos son actuaciones distintas. Debe aprobarse un procedimiento de salida y precisar las obligaciones que subsisten.'
        ]
      },
      {
        id: 'salida-y-conservacion', heading: '10. Exportación y conservación',
        paragraphs: [
          'Antes de aprobar estas condiciones se informarán los datos exportables, formatos, solicitantes autorizados, canal seguro y ventana de acceso al finalizar. No se promete una herramienta o plazo aún no implementado y validado.',
          'La retención distinguirá cuenta, soportes comerciales, datos operativos, auditoría y respaldos. Cada categoría se conservará solo por una finalidad u obligación justificada. Una obligación específica no autoriza conservar indefinidamente toda la cuenta.',
          'La versión final describirá supresión activa, ciclo de respaldos y excepciones justificadas. No se fija un plazo fiscal uniforme ni se promete borrado inmediato de toda copia.'
        ]
      },
      {
        id: 'responsabilidad', heading: '11. Obligaciones y responsabilidad',
        paragraphs: [
          'Cada parte responderá por sus obligaciones y daños imputables conforme al contrato y a la ley, limitando la reparación a los daños acreditados y legalmente atribuibles a su incumplimiento, según causalidad, previsibilidad cuando sea exigible y circunstancias del caso, sin reducir reparaciones obligatorias. El comercio revisará operaciones y configuraciones; el proveedor prestará diligentemente el servicio y atenderá los incidentes de su ámbito.',
          'Los fallos de equipos, conectividad o terceros pueden afectar la operación, pero no exoneran automáticamente al proveedor. También se examinarán su selección, configuración, integración y gestión de la incidencia.',
          'No se establece un tope económico ni se excluye toda pérdida de datos o interrupción. Una limitación futura requerirá revisión de proporcionalidad y legalidad y no amparará dolo, culpa grave, obligaciones irrenunciables ni impedirá derechos de los titulares.'
        ]
      },
      {
        id: 'reclamaciones-y-consumo', heading: '12. Reclamaciones y derechos aplicables',
        paragraphs: [
          'Se propone legal@cripton.com.co para comunicaciones legales; recepción, atención, radicación y seguimiento deben verificarse antes de publicar. Soporte, cobros y privacidad tendrán procedimientos identificables aunque compartan un canal atendido.',
          'La condición de consumidor se determina por la finalidad de la adquisición y la ley, no solo por ser empresa o denominar el servicio B2B. Cuando exista relación de consumo se respetarán garantías, información y mecanismos de reclamación aplicables.',
          'Si procede retracto por contratación a distancia, el término general para servicios es de cinco días hábiles desde celebrar el contrato, sujeto a reglas y excepciones legales. El inicio con acuerdo del consumidor requiere evidencia; crear la cuenta no presume renuncia. Las devoluciones de comercio electrónico que correspondan respetarán la Ley 2439 de 2024. La reversión del pago es distinta de la cancelación y se atenderá cuando legalmente corresponda.'
        ]
      },
      {
        id: 'cambios-y-ley', heading: '13. Versiones y ley aplicable',
        paragraphs: [
          'Rige la legislación colombiana aplicable. La reclamación directa no impide acudir a autoridades o jueces competentes. No se impone arbitraje obligatorio ni foro que suprima derechos legales.',
          'La orden y condiciones particulares describirán la compra; el anexo regulará el tratamiento por cuenta del comercio y la política, el tratamiento propio del proveedor. Ninguno reducirá obligaciones legales ni alterará retroactivamente lo aceptado.',
          'Los cambios tendrán nuevas versiones y comunicación según su alcance. Cuando requieran aceptación o autorización, se obtendrá antes de aplicarlos. Publicar o continuar usando el servicio no sustituye automáticamente esa manifestación. La fecha 2026-10-26 identifica esta revisión, sin entrada en vigor.'
        ]
      }
    ]
  },
  {
    slug: 'privacidad',
    title: 'Política de tratamiento de datos personales — borrador',
    description: 'Propuesta de privacidad que distingue datos de la cuenta SaaS y datos operativos tratados por cuenta del comercio.',
    lead: 'Propuesta sobre finalidades, derechos, proveedores, seguridad y conservación de datos personales en Cripton.',
    pending: [
      'Completar la identidad, identificación, domicilio, dirección, teléfono y persona o área encargada del responsable. Confirmar recepción y seguimiento de legal@cripton.com.co.',
      'Cerrar inventario de datos y proveedores, países de tratamiento, contratos y mecanismos internacionales y matriz de conservación por categoría.',
      'Verificar almacenamiento, pagos, correo, exportación, supresión e incidentes. Aprobar autorización y fecha de vigencia; 2026-10-26 solo identifica esta revisión.'
    ],
    sections: [
      {
        id: 'identidad-y-alcance', heading: '1. Identidad y alcance',
        paragraphs: [
          'La política definitiva identificará a la persona natural o jurídica que opera Cripton y determina sus finalidades propias de tratamiento. La marca no reemplaza esa identificación. Esta propuesta comprende datos de personas naturales vinculadas al registro, la relación comercial, el soporte y la prestación.',
          'Los registros de una empresa pueden contener datos personales de representantes, empleados, compradores o proveedores. El carácter empresarial de la cuenta no elimina los derechos de esas personas.'
        ]
      },
      {
        id: 'dos-roles', heading: '2. Responsable de la cuenta y encargado del comercio',
        paragraphs: [
          'El operador será responsable cuando decida finalidades para gestionar registro, contactos, relación comercial, cobro y seguridad propia de la plataforma.',
          'El comercio será responsable de los datos de sus clientes, empleados, proveedores y demás personas que incorpore al POS para sus actividades. Cripton actuará como encargado al alojarlos, organizarlos, consultarlos, transmitirlos o respaldarlos por cuenta del comercio, conforme al anexo de tratamiento.',
          'Los roles dependen de decisiones y actividades efectivas. Reutilizar información operativa para fines propios no queda cubierto por denominarse encargado: requeriría analizar su licitud y la información al titular.'
        ]
      },
      {
        id: 'categorias-y-origen', heading: '3. Datos y fuentes',
        paragraphs: [
          'El registro solicita nombre de contacto, correo, empresa, teléfono opcional y plan. La relación puede generar datos de verificación, usuarios, pedidos, suscripción, referencias y estados de pago, aceptaciones y soporte.',
          'La prestación puede generar identificadores de cuenta y tenant, acciones administrativas y registros técnicos para seguridad y diagnóstico. El inventario definitivo precisará campos, procedencia y conservación, sin suponer que toda información técnica se almacena.',
          'Los datos operativos provienen del comercio y sus usuarios: identificación y contacto de terceros vinculados con ventas, caja, inventario y documentos electrónicos. La existencia de un campo no justifica recolectarlo en toda operación.'
        ]
      },
      {
        id: 'finalidades', heading: '4. Finalidades del tratamiento propio',
        paragraphs: ['Cada categoría debe vincularse con una finalidad concreta y con la autorización o excepción legal que corresponda. Se proponen estas finalidades necesarias para la relación:'],
        items: [
          'Recibir registros, verificar correo y administrar accesos y relación con el comercio.',
          'Gestionar plan, suscripción, pedido, cobro, conciliación y comunicaciones transaccionales.',
          'Atender soporte, solicitudes de privacidad y reclamaciones y conservar evidencia pertinente.',
          'Prevenir accesos indebidos y fraude y diagnosticar incidentes con datos pertinentes y acceso limitado.',
          'Cumplir obligaciones legales concretas y ejercer o defender derechos cuando proceda, sin una habilitación ilimitada.'
        ]
      },
      {
        id: 'autorizacion-y-elecciones', heading: '5. Autorización y elecciones',
        paragraphs: [
          'Antes de recolectar datos se informarán responsable, tratamiento, finalidades, derechos y canales. Cuando corresponda autorización se obtendrá una manifestación previa e informada consultable después. El contrato no se usará como excepción general a ese deber.',
          'Aceptación contractual, autorización de datos de cuenta, publicidad y cobro recurrente tienen objetos distintos. Se debe identificar la decisión y el texto de cada una. El silencio y las casillas premarcadas no se usarán como prueba de autorización.',
          'La publicidad o prospección, si se propone, requerirá opción específica y voluntaria y un medio sencillo para retirarla. No será condición necesaria del servicio. Los avisos transaccionales de cuenta se explicarán separadamente.'
        ]
      },
      {
        id: 'proveedores-y-destinatarios', heading: '6. Proveedores y destinatarios',
        paragraphs: ['La versión definitiva identificará entidades contratadas, servicio, categorías comunicadas, rol y ubicaciones relevantes. No todos son necesariamente encargados: el receptor puede desarrollar tratamientos propios que deben distinguirse.'],
        subsections: [
          { heading: 'Wompi: pago de la suscripción', paragraphs: ['El flujo puede comunicar datos necesarios del pagador y la operación y recibir referencias, estados y datos tokenizados. Se identificarán los formularios y autorizaciones del proveedor. Debe verificarse que Cripton no reciba ni registre números completos de tarjeta o códigos de seguridad, incluidos logs; este borrador no certifica esa ausencia.'] },
          { heading: 'Microsoft: correo del servicio', paragraphs: ['El correo transaccional puede comunicar direcciones, contenido y metadatos a Microsoft 365. Se minimizará el contenido y se protegerán los enlaces de acceso. Verificar una cuenta no justifica enviar registros operativos completos.'] },
          { heading: 'Factus: documentos del comercio', paragraphs: ['La integración puede comunicar datos de emisor, adquirente y operación necesarios para procesar documentos electrónicos. El alcance depende del comercio y su configuración fiscal. Deben comprobarse el rol contractual y las comunicaciones posteriores; activar FE no autoriza finalidades ajenas a la emisión contratada.'] }
        ]
      },
      {
        id: 'tratamiento-internacional', heading: '7. Tratamiento internacional',
        paragraphs: [
          'No se afirma residencia exclusiva en Colombia. Antes de aprobar la política se confirmarán ubicaciones de alojamiento, correo, respaldo y soporte, incluidos accesos desde otros países.',
          'Se distingue transmisión a un encargado que trabaja por cuenta del responsable de transferencia a un receptor que decide sus finalidades. Una transmisión internacional con contrato que cumpla los requisitos legales tiene régimen distinto de una transferencia. No se presume que una autorización genérica sustituya ese análisis.',
          'Cada transferencia deberá contar con un mecanismo permitido por la legislación colombiana según receptor y operación. Nombrar un proveedor no acredita la existencia del contrato ni del mecanismo exigible.'
        ]
      },
      {
        id: 'seguridad', heading: '8. Acceso, confidencialidad e incidentes',
        paragraphs: [
          'La política final describirá medidas efectivamente implantadas sobre acceso por función, separación entre tenants, trazabilidad, secretos y recuperación. El personal y los proveedores tendrán acceso limitado a sus tareas y deberes de confidencialidad.',
          'Las medidas no eliminan todos los riesgos; ello no libera de seguridad, atención de incidentes ni responsabilidad por actuaciones imputables. Los incidentes se documentarán, contendrán y evaluarán para determinar comunicaciones al comercio, autoridades y titulares cuando correspondan.',
          'Los canales y plazos internos deben permitir cumplir las obligaciones legales. Este documento no certifica ausencia de incidentes ni cumplimiento integral.'
        ]
      },
      {
        id: 'conservacion-y-supresion', heading: '9. Conservación y supresión',
        paragraphs: [
          'La conservación atenderá finalidad y obligaciones de cada categoría. La política final informará criterios y periodos de vigencia de las bases, diferenciando registros no completados, cuentas, soportes contractuales y contables, pagos, soporte, auditoría y respaldos.',
          'Terminar la suscripción no borra toda evidencia contractual ni autoriza conservación indefinida. Las excepciones por obligación legal, contractual o reclamación se documentarán y limitarán a los datos pertinentes.',
          'Los datos operativos seguirán las instrucciones lícitas del comercio y el anexo. La supresión activa, el vencimiento de respaldos y la reaparición de datos al restaurar requieren controles propios. No se fija un plazo uniforme aún no aprobado.'
        ]
      },
      {
        id: 'derechos', heading: '10. Derechos de los titulares',
        paragraphs: [
          'Las personas podrán conocer, actualizar y rectificar datos; solicitar prueba de autorización cuando sea exigible; conocer el uso de la información; acceder gratuitamente en los términos legales; y pedir revocatoria o supresión cuando corresponda. Podrán acudir a la SIC después de agotar el trámite previo exigible.',
          'Si una obligación legal o contractual impide suprimir determinados datos se explicarán fundamento y alcance. No se convertirá esa excepción en negativa automática para toda la información.'
        ]
      },
      {
        id: 'procedimiento', heading: '11. Consultas y reclamos',
        paragraphs: [
          'Se propone legal@cripton.com.co, pendiente de verificar recepción y atención. La política identificará a la persona o área a cargo y un medio accesible con constancia y seguimiento. Se pedirá lo necesario para identificar al titular, ubicar datos y entender su solicitud, sin requisitos desproporcionados.',
          'Las consultas se atenderán en diez días hábiles desde su recepción. Si no es posible, se informarán motivos y fecha con ampliación máxima de cinco días hábiles. Los reclamos se resolverán en quince días hábiles desde el día siguiente a su recibo; una ampliación justificada y comunicada no superará ocho días hábiles adicionales.',
          'Si un reclamo es incompleto se requerirá subsanación dentro de cinco días siguientes. Transcurridos dos meses del requerimiento sin completarlo, se entenderá desistido. Si no se es competente, se trasladará en máximo dos días hábiles e informará al interesado. Recibido completo, se registrará reclamo en trámite dentro de dos días hábiles hasta decidirlo.',
          'Las solicitudes sobre datos operativos se coordinarán con el comercio responsable. Cripton mantendrá trazabilidad y prestará asistencia como encargado; remitir al comercio no elimina sus deberes ni autoriza exponer otros tenants.'
        ]
      },
      {
        id: 'datos-especiales-y-navegacion', heading: '12. Datos especiales y navegación',
        paragraphs: [
          'El registro revisado no solicita datos sensibles ni datos de menores. La respuesta sobre datos sensibles es facultativa; no se condicionará el servicio a información sensible innecesaria. Cualquier tratamiento de datos de menores exige evaluación de sus derechos prevalentes y las condiciones legales especiales. No deben incorporarse por campos libres o adjuntos para finalidades no previstas. Si una función los requiere, deben evaluarse necesidad y salvaguardas especiales antes de habilitarla; la política general no basta como autorización.',
          'El registro utiliza almacenamiento de sesión del navegador para el intento y la idempotencia. Deben explicarse contenido y eliminación e inventariarse almacenamiento técnico y tecnologías de terceros. No se declarará ausencia de persistencia cuando el flujo la utiliza.',
          'Si se incorporan analítica, publicidad o seguimiento con datos personales, se evaluarán finalidad y autorización exigible antes de activarlos. No se presenta como existente una herramienta no comprobada.'
        ]
      },
      {
        id: 'versiones', heading: '13. Versiones y vigencia',
        paragraphs: [
          'La versión final indicará fecha de entrada en vigor, historial accesible y vigencia de las bases. Los cambios sustanciales se comunicarán oportunamente. Un cambio de finalidad que requiera nueva autorización no se aplicará por publicar otra política.',
          'Esta revisión del 2026-10-26 no está vigente. Las condiciones y políticas aceptadas deben poder consultarse como fueron presentadas.'
        ]
      }
    ]
  },
  {
    slug: 'tratamiento-por-cuenta-del-cliente',
    title: 'Tratamiento por cuenta del cliente — borrador',
    description: 'Propuesta de anexo de transmisión de datos entre el comercio responsable y el operador de Cripton como encargado.',
    lead: 'Propuesta de instrucciones, obligaciones y salvaguardas para los datos personales que el comercio incorpora al POS.',
    pending: [
      'Identificar y acreditar a ambas partes, representantes y contactos; individualizar tenant, servicio, duración y política del comercio que integra las instrucciones.',
      'Aprobar inventario de datos, operaciones, proveedores posteriores, ubicaciones y mecanismos internacionales. No se autoriza una lista indeterminada de terceros.',
      'Completar medidas de seguridad verificadas, gestión de incidentes, asistencia, revisión y salida: formatos, acceso, devolución, supresión y ciclo de respaldos.'
    ],
    sections: [
      {
        id: 'partes-y-objeto', heading: '1. Partes, objeto y alcance',
        paragraphs: [
          'El comercio contratante será el responsable de los datos personales que incorpore al POS para sus finalidades comerciales lícitas. El operador legal de Cripton, cuya identidad debe completarse, será el encargado de tratarlos por cuenta del comercio en el alcance acordado. La marca del producto no sustituye la identificación de las partes.',
          'Este anexo propuesto regula la transmisión para prestar el servicio contratado y las obligaciones frente al comercio y los titulares. Solo se incorporará al contrato después de completar sus pendientes y formalizar su aceptación por quienes tengan facultades. Publicar esta página no celebra el anexo.',
          'El tratamiento propio de datos de cuenta, suscripción y relación comercial se describirá en la política del operador. El rol se determina por cada actividad: este anexo no permite convertir datos operativos en una base para fines propios de Cripton.'
        ]
      },
      {
        id: 'datos-titulares-y-operaciones', heading: '2. Titulares, datos y operaciones',
        paragraphs: [
          'Según los módulos utilizados, los titulares pueden ser compradores, representantes, empleados, cajeros, proveedores y otras personas relacionadas con el comercio. Los datos pueden incluir identificación, contacto, referencias comerciales y fiscales, operaciones de venta, caja, inventario y documentos electrónicos vinculados a personas naturales.',
          'Las operaciones autorizables comprenden recepción, organización, alojamiento, consulta por usuarios autorizados, actualización, generación de documentos y reportes, transmisión a destinatarios autorizados, soporte, respaldo, recuperación, devolución y supresión. El inventario acordado deberá indicar qué operaciones se realizan realmente y para qué finalidad.',
          'La orden de servicio individualizará comercio y tenant, módulos, tipos de datos, titulares, operaciones, ubicaciones, duración y contactos. Las instrucciones incorporarán la política de tratamiento del comercio y las finalidades autorizadas por los titulares o permitidas por ley. No se presupone que todos los campos o módulos sean necesarios para todos los comercios.'
        ]
      },
      {
        id: 'instrucciones', heading: '3. Instrucciones y límites del encargo',
        paragraphs: [
          'Cripton tratará los datos únicamente para prestar las actividades acordadas, conforme a instrucciones documentadas, la política del responsable, los principios de protección de datos y la ley. Los cambios de alcance requerirán registro y evaluación antes de ejecutarse.',
          'Las instrucciones deberán provenir de personas facultadas y permitir identificar el tenant afectado. Si una instrucción parece exceder el encargo o contrariar la ley, Cripton lo comunicará al responsable y pedirá aclaración antes de realizar la operación cuestionada, sin impedir medidas urgentes exigibles para proteger datos o cumplir una orden legal.',
          'El encargo no autoriza vender bases, publicidad propia, entrenamiento de modelos con datos operativos, combinación entre comercios ni uso de producción en demostraciones. Una finalidad adicional exige análisis y habilitación propios; no se presume por el acceso técnico.',
          'Una orden de autoridad se verificará y atenderá en su alcance obligatorio, con información al comercio cuando esté legalmente permitido. Se documentarán motivo, datos entregados y destinatario, sin revelar información de otros tenants.'
        ]
      },
      {
        id: 'deberes-del-responsable', heading: '4. Obligaciones del comercio responsable',
        paragraphs: [
          'El comercio determinará finalidades lícitas, informará a los titulares, obtendrá y conservará autorizaciones cuando sean exigibles y transmitirá únicamente datos cuyo tratamiento esté permitido. Mantendrá calidad, pertinencia y actualización y comunicará correcciones y reclamos al encargado.',
          'El comercio administrará usuarios y permisos, verificará que sus instrucciones estén autorizadas, identificará contactos para derechos e incidentes y facilitará su política de tratamiento. El acceso de un empleado no sustituye las autorizaciones de los titulares ni permite transmitir datos de otra empresa.',
          'Si requiere datos sensibles o de niños, niñas y adolescentes deberá evaluar previamente necesidad, autorización y salvaguardas especiales, incluida la protección prevalente de los menores. Responder sobre datos sensibles es facultativo y no debe condicionarse el servicio a su suministro innecesario. Este anexo no habilita por sí solo esas categorías.',
          'Estas obligaciones no desplazan los deberes legales del encargado ni convierten al comercio en responsable de cualquier incidente originado en la plataforma.'
        ]
      },
      {
        id: 'deberes-del-encargado', heading: '5. Obligaciones de Cripton como encargado',
        paragraphs: [
          'Cripton dará tratamiento a nombre del responsable conforme a los principios aplicables; protegerá las bases de datos y mantendrá confidencialidad. Limitará el acceso a personal autorizado para el servicio y vinculado a deberes de reserva que subsistan al finalizar su relación.',
          'Implementará las instrucciones lícitas de actualización y rectificación, atenderá los deberes de consultas y reclamos que le correspondan, registrará la información en discusión y evitará circular datos bloqueados por decisión de la autoridad cuando resulte aplicable.',
          'Mantendrá evidencia pertinente de instrucciones, accesos y operaciones sensibles y colaborará con requerimientos de la autoridad. Si reúne respecto de un tratamiento la calidad de responsable y encargado cumplirá los deberes correspondientes a ambas.',
          'El acceso de soporte deberá estar justificado y limitado a lo necesario. El contrato no constituye autorización para consultar indiscriminadamente datos operativos de los comercios.'
        ]
      },
      {
        id: 'seguridad-y-separacion', heading: '6. Seguridad, separación y recuperación',
        paragraphs: [
          'El anexo definitivo describirá medidas técnicas, humanas y administrativas efectivas de acceso por función, aislamiento por tenant, gestión de credenciales y secretos, trazabilidad, cambios, respaldo y recuperación. La intensidad de los controles será proporcional a los datos, operaciones y riesgos.',
          'Las pruebas y la producción deberán diferenciarse. No se mezclarán datos, credenciales ni documentos de distintos tenants, emisores o ambientes fiscales. La separación debe abarcar consultas, exportaciones, soporte, respaldos y reintentos.',
          'Los respaldos se protegerán y su recuperación se validará según el procedimiento acordado. Se identificarán alcance, exclusiones, responsables y ciclo de conservación; no se afirma un tiempo de recuperación ni disponibilidad aún no aprobado.',
          'La inexistencia de una certificación o de un SLA no reduce las obligaciones legales de seguridad. Este borrador no acredita la implantación de los controles ni garantiza ausencia de fallos.'
        ]
      },
      {
        id: 'proveedores-posteriores', heading: '7. Proveedores posteriores y destinos',
        paragraphs: [
          'Antes de iniciar el encargo se aprobará un registro de los terceros que intervienen: identidad jurídica, función, datos, rol, ubicación y condiciones de protección. La incorporación o sustitución se informará al comercio mediante el procedimiento acordado, con evaluación de su impacto e instrucciones antes de comunicar datos.',
          'Cuando un tercero trate datos por cuenta del responsable, Cripton exigirá obligaciones compatibles de finalidad, seguridad, confidencialidad, asistencia y salida y verificará su cumplimiento en el alcance que le corresponda. No se presume autorización ilimitada para subcontratar ni se libera al encargado de sus obligaciones por utilizar terceros.',
          'Si el destinatario decide finalidades propias se identificará ese tratamiento y su habilitación; no se le denominará encargado por conveniencia. La contratación con cada proveedor y sus comunicaciones posteriores deben revisarse, sin afirmar condiciones o países aún no comprobados.'
        ],
        subsections: [
          { heading: 'Factus y origen fiscal', paragraphs: ['La integración de facturación electrónica opera según tenant, emisor y ambiente configurados. Se comunicarán únicamente datos de emisor, adquirente y operación necesarios para la emisión y gestiones autorizadas. Un plan FE no sustituye las habilitaciones del emisor. Los documentos, consultas y reintentos conservarán su contexto de origen; no se trasladarán documentos de prueba a producción por cambiar una configuración.'] },
          { heading: 'Wompi y Microsoft', paragraphs: ['Wompi interviene en los pagos de la suscripción y Microsoft en el correo del servicio. Esos flujos pueden corresponder al tratamiento propio de cuenta descrito en la política. Su uso no autoriza entregarles toda la base operativa del comercio. Si una función requiere comunicar datos operativos a estos u otros proveedores deberá estar identificada, minimizada y amparada por las instrucciones y el mecanismo aplicables.'] }
        ]
      },
      {
        id: 'operaciones-internacionales', heading: '8. Transmisiones y transferencias internacionales',
        paragraphs: [
          'Se identificarán ubicaciones de alojamiento, respaldo, soporte y acceso remoto. No se promete residencia exclusiva en Colombia. La evaluación incluirá destinatarios posteriores y cambios relevantes de ubicación.',
          'Una transmisión a un encargado por cuenta del responsable se sujetará al contrato que cumpla el artículo 2.2.2.25.5.2 del Decreto 1074 de 2015. El régimen de transmisiones internacionales con ese contrato no constituye una dispensa general de informar finalidades, obtener las autorizaciones del tratamiento original o cumplir los demás deberes.',
          'Si hay transferencia a un receptor que decide sobre los datos se evaluarán el artículo 26 de la Ley 1581 de 2012 y el mecanismo legal aplicable. La sola firma de este borrador no acredita un país adecuado, una excepción ni una declaración de conformidad.'
        ]
      },
      {
        id: 'derechos-y-asistencia', heading: '9. Derechos y asistencia al responsable',
        paragraphs: [
          'Las partes coordinarán el acceso, prueba de autorización, información sobre uso, actualización, rectificación y las solicitudes de revocatoria o supresión procedentes. El encargado facilitará al comercio la información necesaria por un medio seguro y con verificación proporcional de identidad.',
          'Recibir una solicitud sobre el comercio no habilita a consultar otro tenant. El traslado por falta de competencia se hará en máximo dos días hábiles e informando al interesado, conforme a la ley; remitir no elimina los deberes propios del encargado.',
          'Se respetarán los términos legales: consultas en diez días hábiles desde recepción, con ampliación motivada de hasta cinco adicionales; reclamos en quince días hábiles desde el día siguiente al recibo, con ampliación motivada de hasta ocho adicionales. Se aplicarán las reglas de subsanación y registro del reclamo en trámite descritas en el borrador de privacidad.',
          'Las partes acordarán tiempos de coordinación internos que permitan cumplir esos términos. No se subordinará el ejercicio de derechos al pago de una factura ni a la renuncia a acciones legales.'
        ]
      },
      {
        id: 'incidentes', heading: '10. Incidentes y cooperación',
        paragraphs: [
          'Al conocer una violación de seguridad que afecte datos del encargo, Cripton informará al contacto autorizado del comercio sin dilación injustificada y con la información disponible. Documentará detección, alcance conocido, categorías y posibles consecuencias, medidas de contención y contacto de seguimiento; actualizará los hallazgos relevantes.',
          'Las partes preservarán evidencia pertinente, limitarán exposición, investigarán causas y coordinarán recuperación y acciones correctivas. No se esperará un informe definitivo para emitir una comunicación necesaria ni se expondrán datos de otros tenants.',
          'Cada parte cumplirá los reportes a la SIC y demás comunicaciones exigibles según su rol y la normativa aplicable. La coordinación no reemplaza esos deberes. Deben concretarse responsables, canal seguro y tiempos internos; no se inventa aquí un plazo universal de notificación ni se promete ausencia de incidentes.'
        ]
      },
      {
        id: 'evidencia-y-revision', heading: '11. Evidencia y revisión del encargo',
        paragraphs: [
          'Cripton facilitará información pertinente para demostrar las obligaciones del encargo, incluidos el registro de instrucciones, proveedores y medidas aplicables. El comercio podrá solicitar aclaraciones y revisión proporcionada al riesgo mediante un procedimiento acordado.',
          'Las revisiones protegerán secretos, seguridad de la plataforma y datos de otros comercios. Se definirán alcance, acceso, confidencialidad y tratamiento de hallazgos sin bloquear requerimientos de la autoridad ni derechos legales. No se presume una certificación por disponer de una política escrita.',
          'Las deficiencias verificadas se documentarán y corregirán según su gravedad y las obligaciones aplicables. No se pacta una exoneración automática por fallos de proveedores posteriores.'
        ]
      },
      {
        id: 'duracion-y-salida', heading: '12. Duración, devolución y supresión',
        paragraphs: [
          'El encargo durará lo necesario para las actividades contratadas y las operaciones de cierre lícitamente acordadas. Cancelar una renovación, suspender el acceso y suprimir información son decisiones distintas; ninguna autoriza una retención indefinida.',
          'Al terminar, el responsable instruirá devolución o supresión conforme al procedimiento acordado. Antes de adoptar este anexo se concretarán datos cubiertos, formato, canal seguro, verificación de solicitante, ventana de entrega y confirmación de ejecución. No se promete una función de exportación aún no validada.',
          'Si una obligación exige conservar datos se identificará su fundamento, categoría y duración; el acceso quedará restringido al fin que lo justifica. La evidencia propia de la relación comercial se distinguirá de la base operativa del comercio.',
          'La supresión de datos activos y la expiración de respaldos se describirán por separado, con controles para evitar reincorporar datos suprimidos al restaurar. Se documentará el cierre y subsistirán confidencialidad, seguridad y deberes legales mientras existan datos conservados.'
        ]
      },
      {
        id: 'responsabilidad-y-adopcion', heading: '13. Responsabilidad, ley y adopción',
        paragraphs: [
          'Cada parte responderá por incumplimientos y daños que le sean imputables conforme a la ley. La distribución de tareas no limita las facultades de la autoridad ni los derechos de los titulares. No se excluyen dolo, culpa grave ni deberes irrenunciables.',
          'El anexo se regirá por la legislación colombiana aplicable y complementará el contrato del servicio sin reducir el nivel de protección exigido por ley. Toda modificación de instrucciones o condiciones deberá quedar documentada y aprobarse por el mecanismo correspondiente.',
          'La revisión 2026-10-26 es un borrador sin entrada en vigor, sin aceptación contractual y sin incorporación al registro de cuentas. Los pendientes identificados requieren decisión y validación antes de su adopción.'
        ]
      }
    ]
  }
];
