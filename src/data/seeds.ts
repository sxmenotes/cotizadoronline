import type { Catalog, Issuer, TermsContent } from '../domain/types';

export const catalogSeed: Catalog = {
  "schemaVersion": 1,
  "plans": [
    {
      "id": "landing",
      "name": "Plan Landing básico",
      "pages": 1,
      "build": {
        "price": 100000,
        "desc": "1 landing page"
      },
      "sale": {
        "price": 150000,
        "desc": "1 landing page + código fuente completo"
      }
    },
    {
      "id": "landingPlus",
      "name": "Plan Landing full",
      "pages": 3,
      "build": {
        "price": 120000,
        "desc": "Landing page + 2 páginas adicionales"
      },
      "sale": {
        "price": 190000,
        "desc": "Landing + 2 páginas + código fuente completo"
      }
    },
    {
      "id": "landingFull",
      "name": "Plan Landing Premium",
      "pages": 5,
      "build": {
        "price": 140000,
        "desc": "Landing page + 4 páginas adicionales"
      },
      "sale": {
        "price": 230000,
        "desc": "Landing + 4 páginas + código fuente completo"
      }
    }
  ],
  "subscriptions": [
    {
      "id": "none",
      "name": "Ninguno",
      "price": 0,
      "desc": "Sin mantención mensual."
    },
    {
      "id": "basico",
      "name": "Básico",
      "price": 40000,
      "desc": "Mantenimiento activo, 1 cambio menor al mes. Sin dominio ni hosting."
    },
    {
      "id": "full",
      "name": "Full",
      "price": 50000,
      "desc": "Todo lo Básico + 1 cambio adicional (2 total, ambos menores) + 1 pág extra al año."
    },
    {
      "id": "premium",
      "name": "Premium",
      "price": 60000,
      "desc": "Todo lo Full + 3 cambios al mes (máx. 1 mayor gratis) + monitoreo de estadísticas."
    }
  ],
  "hosting": {
    "label": "Sí, alojar en su servidor",
    "monthlyPrice": 10000
  },
  "extraPagePrice": 15000,
  "depositPercent": 50,
  "deliveryBusinessDays": 8
};

export const issuerSeed: Issuer = {
  "name": "SAMUEL VALENZUELA",
  "brandSubtitle": "PROPUESTA COMERCIAL",
  "documentTag": "PROPUESTA DE SERVICIOS WEB",
  "serviceTagline": "Diseño, desarrollo y mantención para potenciar tu presencia digital.",
  "footerBrand": "Samuel Valenzuela · Desarrollo & Mantención Web",
  "bankDetails": [
    "Solicitar datos de transferencia de forma directa por WhatsApp."
  ],
  "contact": []
};

export const termsSeed: TermsContent = {
  "pages": [
    {
      "pageNumber": 3,
      "sections": [
        {
          "id": "sec_3_0",
          "title": "",
          "blocks": [
            {
              "type": "paragraph",
              "content": "SAMUEL VALENZUELA PROPUESTA DE SERVICIOS WEB"
            },
            {
              "type": "paragraph",
              "content": "1. Construcción de tu página web Pago único por el diseño y desarrollo de tu sitio. Este pago da acceso a suscribirte a un plan de mantención mensual."
            },
            {
              "type": "table",
              "rows": [
                [
                  "PLAN",
                  "INCLUYE",
                  "PRECIO"
                ],
                [
                  "Landing básico",
                  "1 landing page",
                  "{{build:landing}}"
                ],
                [
                  "Landing full",
                  "Landing page + 2 páginas adicionales",
                  "{{build:landingPlus}}"
                ],
                [
                  "Landing Premium",
                  "Landing page + 4 páginas adicionales",
                  "{{build:landingFull}}"
                ]
              ]
            },
            {
              "type": "callout",
              "content": "¿Necesitas más páginas de las incluidas? Cada página adicional (fuera de las contempladas en tu plan) tiene un costo de {{extraPage}} cada una, cotizada al momento de solicitarla."
            },
            {
              "type": "paragraph",
              "content": "2. Suscripción mensual de mantención Mantén tu sitio funcionando, actualizado y con soporte continuo. Puedes elegir el nivel que mejor se ajuste a tus necesidades."
            },
            {
              "type": "table",
              "rows": [
                [
                  "PLAN",
                  "INCLUYE",
                  "MENSUAL"
                ],
                [
                  "Básico",
                  "Mantenimiento del sitio activo · 1 cambio menor al mes. Dominio y hosting no incluidos.",
                  "{{sub:basico}}"
                ],
                [
                  "Full",
                  "Todo lo del plan Básico + 1 cambio adicional al mes (2 en total, ambos menores) + 1 página adicional sin costo al año.",
                  "{{sub:full}}"
                ],
                [
                  "Premium",
                  "Todo lo del plan Full + 3 cambios al mes (pudiendo ser como máximo uno de ellos un cambio mayor gratuito integrado) + monitoreo de estadísticas. (Dominio y hosting se pagan aparte).",
                  "{{sub:premium}}"
                ]
              ]
            },
            {
              "type": "paragraph",
              "content": "Samuel Valenzuela · Desarrollo & Mantención Web Página 3 de 5"
            }
          ]
        }
      ]
    },
    {
      "pageNumber": 4,
      "sections": [
        {
          "id": "sec_4_0",
          "title": "",
          "blocks": [
            {
              "type": "paragraph",
              "content": "SAMUEL VALENZUELA PROPUESTA DE SERVICIOS WEB"
            },
            {
              "type": "paragraph",
              "content": "3. ¿Qué es un cambio menor y qué es un cambio mayor? Para que sepas exactamente qué está cubierto por tu mensualidad y qué se cotiza aparte:"
            },
            {
              "type": "paragraph",
              "content": "✓ Cambio menor (incluido) Editar texto existente (precios, horarios, etc.) Reemplazar una imagen o foto por otra Actualizar datos de contacto o redes sociales Ajustar un color, botón o detalle puntual ✗ Cambio mayor (se cotiza aparte*) Agregar o eliminar una sección completa Rediseñar la estructura o el layout Integrar una funcionalidad nueva (formularios, pagos) Crear una página nueva fuera de lo pactado * Nota: Un cambio mayor está incluido sin costo extra en el Plan Premium. Para los otros planes, queda con costo adicional a determinar según la complejidad de lo solicitado."
            },
            {
              "type": "callout",
              "content": "EJEMPLO Cambiar el número de teléfono en el pie de página → cambio menor, incluido. Agregar una sección nueva de \"Testimonios\" con su propio diseño → cambio mayor, se cotiza aparte."
            },
            {
              "type": "paragraph",
              "content": "Creación de páginas nuevas durante la suscripción"
            },
            {
              "type": "table",
              "rows": [
                [
                  "PLAN",
                  "CONDICIÓN PARA PÁGINAS NUEVAS"
                ],
                [
                  "Básico",
                  "Cada página nueva se cotiza aparte, valor {{extraPage}} c/u."
                ],
                [
                  "Full",
                  "1 página adicional sin costo por año. Páginas extra sobre esa: {{extraPage}} c/u."
                ],
                [
                  "Premium",
                  "Mismas condiciones que Full, con prioridad de agendamiento sobre otros clientes."
                ]
              ]
            },
            {
              "type": "paragraph",
              "content": "Dominio y hosting"
            },
            {
              "type": "callout",
              "content": "El hosting se cobra aparte en todos los planes ({{hosting}} mensuales extra). En cuanto al dominio, no está incluido en ningún plan y debe ser adquirido por el cliente. Si decides cancelar tu suscripción antes de completar 12 meses, el costo del dominio y hosting ya adquiridos a tu nombre no es reembolsable, ya que corresponde a un gasto realizado por adelantado. Para los planes donde el dominio debe ser adquirido por el cliente (recomendamos dominios .cl a través de NIC Chile), una vez que lo compres, deberás seguir las instrucciones provistas para configurar el servidor de forma correcta y enlazar el dominio con el hosting exitosamente. Alternativamente, puedes proporcionarnos las credenciales de tu administrador de dominio para que hagamos esta configuración por ti."
            },
            {
              "type": "paragraph",
              "content": "Samuel Valenzuela · Desarrollo & Mantención Web Página 4 de 5"
            }
          ]
        }
      ]
    },
    {
      "pageNumber": 5,
      "sections": [
        {
          "id": "sec_5_0",
          "title": "",
          "blocks": [
            {
              "type": "paragraph",
              "content": "SAMUEL VALENZUELA PROPUESTA DE SERVICIOS WEB"
            },
            {
              "type": "paragraph",
              "content": "4. Venta completa sin suscripción Si prefieres no tener una mensualidad, puedes adquirir tu sitio completo, con entrega del código fuente (HTML, CSS y JavaScript o TypeScript), para administrarlo tú mismo o con quien prefieras."
            },
            {
              "type": "table",
              "rows": [
                [
                  "PLAN",
                  "INCLUYE",
                  "PRECIO"
                ],
                [
                  "Landing básico",
                  "1 landing page + código fuente completo",
                  "{{sale:landing}} CLP"
                ],
                [
                  "Landing full",
                  "Landing page + 2 páginas + código fuente completo",
                  "{{sale:landingPlus}}"
                ],
                [
                  "Landing Premium",
                  "Landing page + 4 páginas + código fuente completo",
                  "{{sale:landingFull}}"
                ]
              ]
            },
            {
              "type": "paragraph",
              "content": "Esta opción no incluye soporte, mantención ni futuras actualizaciones — el cliente pasa a ser completamente autónomo con su sitio."
            },
            {
              "type": "paragraph",
              "content": "Descargo de responsabilidad: El desarrollador no se hace responsable por los errores y/o daños que surjan por la incorrecta manipulación del código fuente, con o sin programas o agentes externos."
            },
            {
              "type": "paragraph",
              "content": "¿Ya construiste tu sitio y quieres pasar a venta con código?"
            },
            {
              "type": "callout",
              "content": "Si ya contrataste la construcción de tu página (sección 1) y en algún momento decides independizarte del soporte, se descuenta lo ya pagado por la construcción del valor de venta completa equivalente."
            },
            {
              "type": "callout",
              "content": "EJEMPLO Pagaste {{build:landing}} por el plan Landing básico y estuviste algunos meses en suscripción. Ahora quieres el código fuente → pagas {{sale:landing}} − {{build:landing}} por el código completo."
            },
            {
              "type": "paragraph",
              "content": "Resumen"
            },
            {
              "type": "tags",
              "tags": [
                "Construcción + suscripción → menor costo de entrada",
                "Venta completa → autonomía total, sin mensualidad",
                "Transición → nunca pagas dos veces por lo mismo"
              ]
            },
            {
              "type": "paragraph",
              "content": "Samuel Valenzuela · Desarrollo & Mantención Web Página 5 de 5"
            }
          ]
        }
      ]
    }
  ]
};
