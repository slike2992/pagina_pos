export type SolutionSlug =
  | "ventas-y-caja"
  | "inventario"
  | "reportes"
  | "facturacion-electronica";

export interface SolutionSection {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export interface Solution {
  slug: SolutionSlug;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lead: string;
  cardTitle: string;
  decisionPrompt: string;
  sections: readonly SolutionSection[];
  workflowHeading: string;
  steps: readonly { title: string; body: string }[];
  requirements: readonly string[];
  limits: readonly string[];
  questions: readonly { question: string; answer: string }[];
  demo: { heading: string; description: string; checks: readonly string[] };
  registration: {
    label: string;
    href: "/registro?plan=professional" | "/registro?plan=professional-fe";
  };
  relatedSlugs: readonly SolutionSlug[];
}

// Editorial content, not a plan entitlement matrix. Confirm scope in the demo.
export const solutions: readonly Solution[] = [
  {
    slug: "ventas-y-caja",
    title: "POS para ventas y control de caja en Colombia | Cripton",
    description: "Organiza ventas, aperturas, movimientos y cierres de caja con Cripton POS. Revisa el flujo del turno y los requisitos para tu comercio en Colombia.",
    eyebrow: "Ventas y caja",
    heading: "Sigue cada venta desde el cobro hasta el cierre de caja",
    lead: "Cuando el dinero del turno y las ventas se revisan por separado, explicar una diferencia cuesta más trabajo. Cripton reúne el registro de la venta con las operaciones de caja para que puedas revisar lo ocurrido.",
    cardTitle: "Ventas y control de caja",
    decisionPrompt: "Necesito ordenar los cobros y entender cómo terminó cada turno.",
    sections: [
      {
        heading: "Un turno comienza con una apertura",
        paragraphs: [
          "Antes de cobrar, el equipo necesita identificar la caja en la que va a trabajar y contar con una apertura activa. Cripton permite abrir y cerrar cajas, registrar movimientos y consultar el detalle y el historial de los turnos. Esto da un punto de partida para revisar la operación del día.",
          "Define quién puede abrir, registrar movimientos y cerrar. Los permisos de cada persona ayudan a distribuir esas responsabilidades; tener acceso al sistema no significa que todos deban realizar las mismas acciones.",
        ],
      },
      {
        heading: "Consulta lo vendido y el comprobante que corresponde",
        paragraphs: [
          "El flujo de venta registra productos, cantidades y medios de pago. Después puedes consultar la venta y sus documentos para revisar el detalle o volver a imprimir el comprobante correspondiente. Una venta y una factura electrónica tienen estados y requisitos propios: elegir un plan con facturación no sustituye la preparación del emisor.",
          "Una devolución también debe quedar explicada. El módulo de ventas contempla notas crédito totales o parciales; la devolución de dinero depende de la operación y de los permisos. Si interviene una nota electrónica, su aceptación y los efectos sobre caja deben revisarse antes de dar el proceso por terminado.",
        ],
      },
      {
        heading: "Cierra con registros que puedas contrastar",
        paragraphs: [
          "Al terminar el turno, revisa las ventas, los movimientos y el dinero disponible. Consultar el historial permite volver al turno que necesitas investigar, en lugar de mezclarlo con operaciones posteriores. Una diferencia requiere revisión: el sistema no determina por sí solo su causa.",
          "Por ejemplo, una salida de dinero no explica una reducción de ventas. Conviene revisar qué movimiento se registró, a qué operación corresponde y si hubo una devolución. Este es un criterio de trabajo para la demostración, no un resultado garantizado para todos los negocios.",
        ],
      },
    ],
    workflowHeading: "Qué revisar durante un turno",
    steps: [
      { title: "Preparar la caja", body: "Comprueba la caja y la sucursal de trabajo, realiza la apertura y revisa quién tiene autorización para operar." },
      { title: "Registrar la operación", body: "Comprueba productos, cantidades y medios de pago; consulta el comprobante y registra los movimientos que correspondan." },
      { title: "Revisar y cerrar", body: "Contrasta lo registrado con el dinero disponible, revisa diferencias y conserva el turno como referencia para consultas posteriores." },
    ],
    requirements: [
      "Una conexión a internet y equipos revisados para el uso de la aplicación web.",
      "Productos, precios y medios de pago preparados para el negocio.",
      "Cajas, sucursales y usuarios definidos, con permisos para sus responsabilidades.",
      "Si vas a imprimir, una revisión previa de la impresora, el formato y su compatibilidad con el equipo.",
    ],
    limits: [
      "Las cantidades de cajas, sucursales y usuarios dependen del plan contratado.",
      "Registrar un medio de pago no acredita por sí solo un abono en una cuenta bancaria.",
      "La facturación electrónica requiere una modalidad que la incluya y una habilitación adicional del emisor.",
    ],
    questions: [
      { question: "¿Puedo revisar un turno anterior?", answer: "Sí. El módulo de caja permite consultar turnos y su detalle. En la demostración podemos revisar cómo localizar la apertura que te interesa y contrastar sus movimientos." },
      { question: "¿Una devolución siempre retira dinero de caja?", answer: "No necesariamente. El efecto sobre caja depende de la devolución solicitada y del estado del documento. Conviene revisar por separado la nota, las cantidades devueltas y el movimiento de dinero." },
    ],
    demo: {
      heading: "Prueba el recorrido de una venta y un cierre",
      description: "Trae un ejemplo de tu operación para revisar el flujo con el equipo de Cripton.",
      checks: ["Abrir una caja y registrar una venta.", "Consultar el comprobante y revisar una devolución.", "Localizar los movimientos y el detalle del turno antes de cerrar."],
    },
    registration: { label: "Elegir Profesional para ventas y caja", href: "/registro?plan=professional" },
    relatedSlugs: ["inventario", "reportes"],
  },
  {
    slug: "inventario",
    title: "Software POS para control de inventario | Cripton Colombia",
    description: "Consulta existencias y movimientos, organiza productos y revisa compras, ajustes y traslados con Cripton. Evalúa el inventario que necesita tu comercio.",
    eyebrow: "Inventario",
    heading: "Entiende qué tienes y por qué cambian tus existencias",
    lead: "El stock es más útil cuando puedes seguir los movimientos que lo explican. Cripton permite trabajar con el catálogo, consultar existencias y revisar entradas y salidas para preparar la operación de tu comercio.",
    cardTitle: "Inventario y movimientos",
    decisionPrompt: "Necesito saber qué tengo disponible y revisar entradas, salidas y diferencias.",
    sections: [
      {
        heading: "Empieza por un catálogo que tu equipo reconozca",
        paragraphs: [
          "Un producto necesita una identificación consistente antes de venderse o recibirse. Cripton dispone de catálogo de productos, categorías e impuestos, con opciones de creación y edición según los permisos del usuario. Revisa referencias, códigos y precios para evitar que el equipo confunda artículos distintos.",
          "Si hoy usas una hoja de cálculo o registros en papel, prepara una muestra y revisa cómo organizarla durante la puesta en marcha. La calidad de la información inicial importa: registrar un producto no demuestra que su cantidad coincida con el conteo físico.",
        ],
      },
      {
        heading: "Consulta existencias junto con su historial",
        paragraphs: [
          "El inventario permite consultar stock y kardex, es decir, el historial de movimientos de un producto. Las compras, los ajustes y los traslados tienen operaciones diferenciadas. Esto ayuda a buscar la entrada o salida que explica un cambio, en lugar de corregir una cantidad sin investigar su origen.",
          "Una compra en borrador sirve para preparar la recepción; el movimiento de existencias ocurre al confirmarla. Separar preparación y confirmación ayuda a revisar cantidades y costos antes de afectar el stock. Las acciones disponibles dependen de las funciones habilitadas y de los permisos de la persona.",
        ],
      },
      {
        heading: "Revisa las diferencias antes de ajustar",
        paragraphs: [
          "Si el conteo físico no coincide con el sistema, revisa primero ventas, recepciones, devoluciones y traslados. El módulo contempla consultas de cuadre y operaciones de ajuste. Un ajuste debe responder a una diferencia identificada; por sí solo no demuestra qué la causó.",
          "Las devoluciones de ventas también pueden afectar el inventario. En una nota electrónica, la aceptación del documento y la aplicación de la devolución son pasos que conviene comprobar. Para decidir qué comprar, contrasta las existencias con las ventas de las referencias que quieres reponer.",
        ],
      },
    ],
    workflowHeading: "Una revisión práctica de tus existencias",
    steps: [
      { title: "Preparar una muestra de productos", body: "Selecciona referencias que representen tu negocio y revisa identificación, cantidades de partida, precios e impuestos." },
      { title: "Seguir una entrada y una salida", body: "Revisa una compra, su confirmación y una venta; después consulta los movimientos del producto." },
      { title: "Investigar una diferencia", body: "Contrasta un conteo con el stock y revisa las operaciones antes de decidir si corresponde un ajuste o un traslado." },
    ],
    requirements: [
      "Un catálogo revisado y cantidades iniciales contrastadas con un conteo.",
      "Responsables de compras, ajustes y traslados, con permisos para cada tarea.",
      "Sucursales y destinos de inventario definidos según la operación contratada.",
      "Conexión a internet; revisa en la demo los equipos y lectores que quieras utilizar.",
    ],
    limits: [
      "El límite de ítems y el alcance de inventario dependen del plan; confirma compras, ajustes y traslados antes de contratar.",
      "La consulta de existencias depende de las operaciones registradas y no sustituye el conteo físico.",
      "No se ofrece aquí una migración automática de cualquier archivo ni una previsión automática de demanda.",
    ],
    questions: [
      { question: "¿Puedo conocer el origen de un cambio de stock?", answer: "El kardex y las consultas de movimientos permiten revisar entradas y salidas registradas. La explicación depende de que las operaciones se hayan documentado correctamente." },
      { question: "¿La cantidad cambia al preparar una compra?", answer: "El borrador permite revisar la compra antes de confirmarla. La confirmación es el paso que aplica el movimiento de stock; comprueba ese recorrido en la demostración." },
    ],
    demo: {
      heading: "Sigue un producto de la recepción a la venta",
      description: "Usa una referencia conocida para comprobar si el flujo de inventario encaja con tu manera de trabajar.",
      checks: ["Consultar el producto y sus existencias.", "Preparar y confirmar una entrada de compra.", "Revisar una salida y localizar ambos movimientos en el historial."],
    },
    registration: { label: "Elegir Profesional para inventario", href: "/registro?plan=professional" },
    relatedSlugs: ["ventas-y-caja", "reportes"],
  },
  {
    slug: "reportes",
    title: "Reportes de ventas para comercios en Colombia | Cripton",
    description: "Revisa ventas por fecha, producto, medio de pago, sucursal y usuario con Cripton POS. Aprende qué comparar y qué alcance confirmar antes de contratar.",
    eyebrow: "Reportes",
    heading: "Haz preguntas concretas a las ventas de tu negocio",
    lead: "Un total del día es un punto de partida. Para decidir qué revisar después, necesitas conocer el periodo, los filtros y las operaciones que lo componen. Cripton ofrece consultas de ventas con distintos niveles de detalle.",
    cardTitle: "Reportes de ventas",
    decisionPrompt: "Necesito comparar ventas y entender qué productos o medios de pago explican un resultado.",
    sections: [
      {
        heading: "Elige el reporte según la decisión",
        paragraphs: [
          "Ventas diarias permite revisar la actividad de un periodo. Las consultas por referencia ayudan a mirar los productos vendidos; las de medio de pago, sucursal y usuario ofrecen otras maneras de organizar la información. El resumen comercial reúne indicadores y vistas de ventas para una revisión general.",
          "No todos los reportes responden la misma pregunta. Para preparar una compra, comienza por las referencias vendidas y contrástalas con el inventario. Para revisar cobros, consulta medios de pago y después el turno de caja. Antes de comparar sucursales, comprueba que estás usando periodos equivalentes.",
        ],
        bullets: [
          "Ventas diarias: revisar la actividad entre fechas y consultar su detalle.",
          "Ventas por referencia: identificar qué productos intervienen en el resultado.",
          "Ventas por medio de pago: observar cómo se distribuyen los cobros registrados.",
          "Ventas por sucursal o usuario: revisar la operación desde esos criterios cuando tengas acceso.",
        ],
      },
      {
        heading: "Comprueba fechas, filtros y estados antes de comparar",
        paragraphs: [
          "Cada consulta tiene su propio alcance. Revisa las fechas y los filtros disponibles en la pantalla; no asumas que dos reportes abren con el mismo periodo o incluyen exactamente los mismos estados de venta. Si un total parece distinto, empieza por comprobar esos criterios y el documento de origen.",
          "Por ejemplo, comparar una semana completa con un día aislado no permite concluir que una sede está funcionando mejor. Usa el mismo periodo y revisa los detalles relevantes antes de cambiar compras, horarios o responsabilidades. El reporte muestra registros; la decisión sigue necesitando contexto del negocio.",
        ],
      },
      {
        heading: "Comparte el acceso según las responsabilidades",
        paragraphs: [
          "Las consultas requieren permisos específicos y funciones habilitadas para la empresa. Una persona puede necesitar revisar ventas diarias sin tener acceso al resumen comercial. En la puesta en marcha conviene identificar quién necesita cada vista y confirmar qué incluye el plan.",
          "Si utilizas facturación electrónica, existe una consulta para revisar documentos con filtros propios, como su estado. No confundas el registro de una venta con la aceptación fiscal de su factura: revisa el documento y su estado cuando esa sea la pregunta que quieres resolver.",
        ],
      },
    ],
    workflowHeading: "Cómo preparar una revisión comercial útil",
    steps: [
      { title: "Definir una pregunta", body: "Elige algo comprobable: qué referencias se vendieron o cómo se distribuyeron los medios de pago durante un periodo." },
      { title: "Fijar criterios comparables", body: "Selecciona las fechas y los filtros que permita el reporte; revisa qué estados de operación incluye." },
      { title: "Contrastar con la operación", body: "Consulta el detalle y compáralo con caja o inventario antes de tomar una decisión." },
    ],
    requirements: [
      "Ventas registradas y un periodo con información suficiente para la pregunta que quieres responder.",
      "Un usuario con permiso para cada reporte y las funciones correspondientes habilitadas.",
      "Sucursales y usuarios identificados para que las comparaciones tengan sentido.",
    ],
    limits: [
      "Los reportes disponibles varían según el plan y las funciones habilitadas para la empresa.",
      "Los filtros y criterios pueden diferir entre consultas; revisa cada vista antes de comparar totales.",
      "Una cifra de ventas no equivale a utilidad contable, saldo bancario ni pronóstico de ingresos.",
    ],
    questions: [
      { question: "¿Todos los usuarios ven los mismos reportes?", answer: "No. El acceso combina las funciones habilitadas para la empresa y los permisos del usuario. Confirma las vistas necesarias para cada responsabilidad durante la demostración." },
      { question: "¿Por qué conviene revisar más que el total vendido?", answer: "Porque una decisión puede depender del producto, el medio de pago o el periodo. El detalle permite contrastar el resultado con la operación, sin atribuirle una explicación automática." },
    ],
    demo: {
      heading: "Lleva una pregunta de negocio a la demostración",
      description: "Revisa cómo encontrar la información y qué necesitas comprobar antes de usarla para decidir.",
      checks: ["Consultar ventas de un periodo definido.", "Revisar referencias y medios de pago con criterios comparables.", "Confirmar los reportes incluidos en el plan y los accesos de tu equipo."],
    },
    registration: { label: "Elegir Profesional y revisar sus reportes", href: "/registro?plan=professional" },
    relatedSlugs: ["ventas-y-caja", "inventario"],
  },
  {
    slug: "facturacion-electronica",
    title: "POS con facturación electrónica en Colombia | Cripton",
    description: "Conoce la facturación electrónica de Cripton: preparación por empresa y emisor, ambientes de prueba y producción, estados de documentos y notas crédito.",
    eyebrow: "Facturación electrónica",
    heading: "Prepara la facturación electrónica para tu empresa y su emisor",
    lead: "Contratar una modalidad con facturación electrónica es el primer paso. La emisión también requiere revisar la empresa, los datos del emisor, la numeración y el ambiente de operación antes de comenzar a facturar.",
    cardTitle: "Facturación electrónica",
    decisionPrompt: "Necesito emitir documentos electrónicos y conocer qué debo preparar antes de empezar.",
    sections: [
      {
        heading: "Plan contratado y preparación para emitir",
        paragraphs: [
          "Cripton dispone de modalidades con facturación electrónica e integración con Factus. La disponibilidad comercial y la preparación para emitir son verificaciones diferentes: elegir el plan no autoriza automáticamente al emisor ni confirma que su configuración esté lista.",
          "La preparación se revisa por empresa y, cuando corresponde, por sucursal. Se necesitan datos del emisor, acceso propio al proveedor y numeración compatible con el ambiente. También deben estar preparados los datos de los productos y del cliente requeridos para el documento. Revisa tu caso con el equipo antes de iniciar la emisión.",
        ],
      },
      {
        heading: "Pruebas y producción tienen propósitos distintos",
        paragraphs: [
          "El ambiente de pruebas permite revisar el recorrido antes de pasar a la operación productiva. Cada empresa tiene una configuración separada para pruebas y producción; completar una demostración o una prueba no acredita autorización para emitir documentos productivos.",
          "El paso a producción requiere revisar y confirmar la preparación del emisor por una persona autorizada. Cuando una empresa trabaja con varias sucursales, conviene comprobar el emisor y la configuración que corresponde a cada una. Cambiar el ambiente de nuevas emisiones no transforma los documentos que ya existen.",
        ],
      },
      {
        heading: "Sigue el estado del documento hasta su aceptación",
        paragraphs: [
          "El flujo contempla la emisión directa de factura electrónica y la conversión de un comprobante POS cuando corresponde. Una factura pendiente, enviada o rechazada no debe interpretarse como aceptada. Si el proveedor no confirma el resultado, primero se revisa el estado del documento existente antes de repetir la operación.",
          "Los PDF y XML oficiales se consultan desde el proveedor para documentos aceptados. Una impresión interna del POS no sustituye esos archivos. Esta diferencia importa tanto al entregar un documento al cliente como al revisar su estado posteriormente.",
        ],
      },
      {
        heading: "Las notas crédito conservan el vínculo con su factura",
        paragraphs: [
          "El módulo contempla notas crédito electrónicas totales o parciales sobre facturas aceptadas, según el saldo disponible. La nota permanece vinculada a la factura y a su emisor y ambiente originales. Seleccionar otro ambiente para emitir nuevas facturas no cambia ese origen.",
          "Si hay una devolución, revisa también las cantidades que regresan al inventario y si corresponde devolver dinero por caja. La aceptación de la nota y la aplicación de esos efectos son aspectos que conviene verificar juntos. El tratamiento tributario de tu operación debe revisarse con tu asesor; el software no sustituye ese criterio.",
        ],
      },
    ],
    workflowHeading: "Qué preparar antes de emitir",
    steps: [
      { title: "Revisar la modalidad y el alcance", body: "Confirma que el plan incluye facturación electrónica y revisa la cuota, los documentos contemplados y las condiciones de servicio." },
      { title: "Preparar empresa, emisor y datos", body: "Verifica la información del emisor y sus sucursales, la numeración, el acceso al proveedor y los datos de productos y clientes." },
      { title: "Validar el recorrido en pruebas", body: "Revisa emisión, estados y consulta de documentos. Después confirma por separado los requisitos y la activación del ambiente productivo." },
    ],
    requirements: [
      "Una modalidad con facturación electrónica y un usuario autorizado para las operaciones necesarias.",
      "Identidad del emisor y configuración por empresa, sucursal y ambiente, según corresponda.",
      "Acceso al proveedor y numeración configurados para el ambiente en el que se emitirá.",
      "Productos, impuestos y datos del adquirente revisados para la operación; conexión a internet y disponibilidad del proveedor.",
    ],
    limits: [
      "Las cuotas y los documentos incluidos dependen del plan; confirma también cómo se contabilizan las notas crédito.",
      "Ni el pago del plan ni una prueba aceptada acreditan por sí solos la habilitación productiva del emisor.",
      "La emisión depende de la preparación de la empresa, las validaciones y la respuesta del proveedor. No se garantiza aceptación automática ni operación sin conexión.",
    ],
    questions: [
      { question: "¿Puedo facturar electrónicamente apenas elija un plan FE?", answer: "Primero deben revisarse la habilitación comercial y la preparación del emisor, su numeración, el acceso al proveedor y el ambiente. La contratación no sustituye esas verificaciones." },
      { question: "¿Una factura enviada ya está aceptada?", answer: "No. Debes comprobar su estado. Los documentos pendientes o sin confirmación requieren seguimiento; una impresión interna no demuestra aceptación fiscal." },
      { question: "¿Qué pasa con una nota si cambio a producción?", answer: "La nota debe corresponder a su factura original y conservar su emisor y ambiente. Cambiar el ambiente de nuevas emisiones no convierte las facturas anteriores ni sus notas." },
    ],
    demo: {
      heading: "Revisa la preparación de tu caso antes de contratar",
      description: "La demostración permite conocer el recorrido y detectar la información que necesitas reunir; no constituye una autorización fiscal.",
      checks: ["Identificar empresa, sucursales y emisor.", "Revisar una emisión de prueba, sus estados y sus documentos.", "Confirmar cuota, notas crédito y requisitos pendientes para producción."],
    },
    registration: { label: "Elegir Profesional FE", href: "/registro?plan=professional-fe" },
    relatedSlugs: ["ventas-y-caja", "reportes"],
  },
];
