import type { WNode, BlockMeta } from './types';
import type { SectionType } from '../../../domain/types';

export const BLOCK_METAS: Record<SectionType, BlockMeta> = {
  navbar: {
    type: 'navbar',
    name: 'Barra de Navegación',
    category: 'header',
    icon: 'Menu',
    didacticExplanation: 'Menú superior persistente con el logotipo corporativo y los accesos a las secciones principales del sitio.',
    clientPurpose: 'Permite a los usuarios orientarse de inmediato y navegar hacia los puntos clave del negocio en 1 clic.',
    variants: [
      { variantIndex: 0, name: 'Logo a la izquierda + Menú a la derecha', description: 'Distribución clásica corporativa con botón de acción.' },
      { variantIndex: 1, name: 'Logotipo centrado', description: 'Estilo simétrico ideal para marcas de moda, lujo o gastronomía.' },
    ],
  },
  footer: {
    type: 'footer',
    name: 'Pie de Página',
    category: 'footer',
    icon: 'Footprints',
    didacticExplanation: 'Base final de la web con enlaces legales, datos de contacto, enlaces rápidos y derechos reservados.',
    clientPurpose: 'Transmite formalidad y confianza legal, asegurando que el cliente encuentre vías de soporte o contacto al final de la página.',
    variants: [
      { variantIndex: 0, name: 'Pie de página simple', description: 'Fila horizontal con copyright, redes sociales y contacto.' },
      { variantIndex: 1, name: 'En 3 columnas detalladas', description: 'Información de empresa, enlaces directos y datos de atención.' },
    ],
  },
  hero: {
    type: 'hero',
    name: 'Hero / Cabecera Principal',
    category: 'header',
    icon: 'Sparkles',
    didacticExplanation: 'Primera impresión visual de la página. Contiene el título principal de impacto, la propuesta de valor y los botones de acción.',
    clientPurpose: 'Captura la atención en los primeros 3 segundos y explica claramente qué ofreces y por qué deben elegirte.',
    variants: [
      { variantIndex: 0, name: 'Centrado con botones', description: 'Título destacado al centro con párrafo y botones de conversión.' },
      { variantIndex: 1, name: 'Dividido texto + imagen', description: 'Columna con propuesta a la izquierda y soporte visual a la derecha.' },
      { variantIndex: 2, name: 'Fondo completo de impacto', description: 'Diseño inmersivo con bloque de texto destacado sobre fondo contrastado.' },
    ],
  },
  about: {
    type: 'about',
    name: 'Sobre Nosotros / Empresa',
    category: 'content',
    icon: 'Building2',
    didacticExplanation: 'Sección para presentar la historia, misión, valores o experiencia del equipo detrás del negocio.',
    clientPurpose: 'Humaniza la marca y construye credibilidad ante clientes indecisos.',
    variants: [
      { variantIndex: 0, name: 'Texto + Imagen lateral', description: 'Historia de la empresa junto a una fotografía referencial.' },
      { variantIndex: 1, name: 'Texto centrado con valores', description: 'Declaración central de propósito con pilares de trabajo.' },
    ],
  },
  services: {
    type: 'services',
    name: 'Servicios',
    category: 'content',
    icon: 'Briefcase',
    didacticExplanation: 'Muestra organizada de las soluciones, servicios o especialidades que ofrece tu empresa.',
    clientPurpose: 'Permite al cliente identificar rápidamente qué problema resuelves y en qué consiste cada servicio.',
    variants: [
      { variantIndex: 0, name: '3 Tarjetas destacadas', description: 'Tres cajas con ícono, título, descripción y botón.' },
      { variantIndex: 1, name: 'Lista con íconos', description: 'Filas explicativas de servicios con detalle paso a paso.' },
      { variantIndex: 2, name: '2 Columnas anchas', description: 'Dos bloques principales para servicios de alto valor.' },
    ],
  },
  catalog: {
    type: 'catalog',
    name: 'Catálogo / Productos',
    category: 'content',
    icon: 'ShoppingBag',
    didacticExplanation: 'Vitrina de productos o ítems destacados con imagen referencial, nombre, precio y acción de compra o cotización.',
    clientPurpose: 'Genera interés directo en el catálogo comercial y facilita el flujo hacia el carrito o contacto de ventas.',
    variants: [
      { variantIndex: 0, name: 'Grilla de 3 columnas', description: 'Cuadrícula estándar de productos con botón de acción.' },
      { variantIndex: 1, name: 'Grilla de 4 columnas', description: 'Vista compacta para catálogos con variedad de ítems.' },
      { variantIndex: 2, name: 'Lista destacada', description: 'Fichas horizontales con especificaciones detalladas.' },
    ],
  },
  gallery: {
    type: 'gallery',
    name: 'Galería Visual',
    category: 'content',
    icon: 'Images',
    didacticExplanation: 'Espacio para exhibir fotografías de proyectos terminados, instalaciones, eventos o portafolio.',
    clientPurpose: 'Aporta prueba visual concreta de la calidad de tu trabajo ("ver para creer").',
    variants: [
      { variantIndex: 0, name: 'Grilla uniforme', description: 'Imágenes en proporción regular 1:1 o 4:3.' },
      { variantIndex: 1, name: 'Mosaico dinámico', description: 'Composición con una imagen principal y complementarias.' },
    ],
  },
  process: {
    type: 'process',
    name: 'Proceso / Cómo Trabajamos',
    category: 'content',
    icon: 'ArrowRightCircle',
    didacticExplanation: 'Explicación secuencial de los pasos que sigue el cliente: desde el contacto hasta la entrega.',
    clientPurpose: 'Reduce la fricción y la incertidumbre explicando qué esperar en cada etapa del servicio.',
    variants: [
      { variantIndex: 0, name: 'Pasos horizontales (1, 2, 3)', description: 'Flujo secuencial de izquierda a derecha.' },
      { variantIndex: 1, name: 'Línea de tiempo vertical', description: 'Etapas cronológicas ordenadas de arriba hacia abajo.' },
    ],
  },
  stats: {
    type: 'stats',
    name: 'Cifras y Estadísticas',
    category: 'content',
    icon: 'TrendingUp',
    didacticExplanation: 'Métricas numéricas de éxito (años de trayectoria, clientes atendidos, proyectos entregados).',
    clientPurpose: 'Aporta autoridad instantánea mediante datos duros verificables.',
    variants: [
      { variantIndex: 0, name: '3 Cifras clave', description: 'Tres números grandes con etiquetas explicativas.' },
      { variantIndex: 1, name: '4 Cifras en banda', description: 'Banda horizontal con cuatro métricas de impacto.' },
    ],
  },
  testimonials: {
    type: 'testimonials',
    name: 'Testimonios / Reseñas',
    category: 'conversion',
    icon: 'MessageSquareQuote',
    didacticExplanation: 'Comentarios y valoraciones de clientes satisfechos que respaldan tu servicio.',
    clientPurpose: 'Genera validación social decisiva para convertir prospectos en clientes reales.',
    variants: [
      { variantIndex: 0, name: 'Tarjetas de opiniones', description: 'Comentarios con foto de autor y estrellas de calificación.' },
      { variantIndex: 1, name: 'Cita única destacada', description: 'Testimonio de alto impacto de un cliente clave o reseña de prensa.' },
    ],
  },
  pricing: {
    type: 'pricing',
    name: 'Planes y Precios',
    category: 'conversion',
    icon: 'Tag',
    didacticExplanation: 'Tablas comparativas de tarifas o paquetes con detalle de lo que incluye cada opción.',
    clientPurpose: 'Claridad en la oferta económica y facilitación de la toma de decisiones.',
    variants: [
      { variantIndex: 0, name: '3 Columnas comparativas', description: 'Básico, Destacado (Recomendado) y Premium.' },
      { variantIndex: 1, name: '2 Columnas directas', description: 'Dos alternativas claras para elección rápida.' },
    ],
  },
  team: {
    type: 'team',
    name: 'Equipo Profesional',
    category: 'content',
    icon: 'Users',
    didacticExplanation: 'Presentación de las personas que lideran o ejecutan los proyectos con foto y cargo.',
    clientPurpose: 'Aporta cercanía, profesionalismo y confianza humana.',
    variants: [
      { variantIndex: 0, name: 'Grilla de colaboradores', description: 'Fotos circulares con nombre, rol y redes.' },
      { variantIndex: 1, name: 'Lista con especialidad', description: 'Filas horizontales con biografía breve.' },
    ],
  },
  faq: {
    type: 'faq',
    name: 'Preguntas Frecuentes',
    category: 'content',
    icon: 'HelpCircle',
    didacticExplanation: 'Respuestas a las dudas más habituales de los clientes sobre tiempos, pagos, garantías o envíos.',
    clientPurpose: 'Despeja objeciones de venta y ahorra tiempo en consultas de soporte repetitivas.',
    variants: [
      { variantIndex: 0, name: 'Formato acordeón', description: 'Preguntas desplegables para ahorrar espacio vertical.' },
      { variantIndex: 1, name: 'En dos columnas abiertas', description: 'Preguntas y respuestas visibles simultáneamente.' },
    ],
  },
  cta: {
    type: 'cta',
    name: 'Llamado a la Acción (CTA)',
    category: 'conversion',
    icon: 'Megaphone',
    didacticExplanation: 'Bloque focalizado cuyo único objetivo es invitar al usuario a contactar, agendar o comprar.',
    clientPurpose: 'Es el embudo final de conversión; no deja que el usuario se vaya sin realizar una acción.',
    variants: [
      { variantIndex: 0, name: 'Banda a ancho completo', description: 'Fondo destacado con llamado directo y botón llamativo.' },
      { variantIndex: 1, name: 'Caja flotante centrada', description: 'Tarjeta delimitada con título persuasivo y botón principal.' },
    ],
  },
  contact: {
    type: 'contact',
    name: 'Contacto y Ubicación',
    category: 'conversion',
    icon: 'Mail',
    didacticExplanation: 'Formulario para recibir solicitudes junto con WhatsApp, email, teléfono y mapa de ubicación.',
    clientPurpose: 'Vía directa para recibir oportunidades de negocio de clientes interesados.',
    variants: [
      { variantIndex: 0, name: 'Formulario + Datos de contacto', description: 'Campos de consulta a la izquierda y teléfono/mapa a la derecha.' },
      { variantIndex: 1, name: 'Formulario simple centrado', description: 'Campos mínimos (Nombre, Email, Mensaje) para máxima conversión.' },
    ],
  },
  social: {
    type: 'social',
    name: 'Redes Sociales',
    category: 'footer',
    icon: 'Share2',
    didacticExplanation: 'Invitación a seguir las plataformas sociales de la marca (Instagram, LinkedIn, Facebook).',
    clientPurpose: 'Fomenta la comunidad y la recurrencia de marca más allá de la visita a la web.',
    variants: [
      { variantIndex: 0, name: 'Fila de íconos interactivos', description: 'Enlaces directos con nombre de usuario.' },
      { variantIndex: 1, name: 'Feed o cuadrícula social', description: 'Muestra visual de publicaciones recientes.' },
    ],
  },
};

// Generador de árbol de nodos abstractos para cada bloque
export function getWireframeBlockTree(
  type: SectionType,
  variant: number,
  customLabel?: string
): WNode {
  const meta = BLOCK_METAS[type];
  const title = customLabel?.trim() || meta.name;

  switch (type) {
    case 'hero':
      if (variant === 1) {
        // Hero dividido: texto izquierda, imagen derecha
        return {
          t: 'box',
          dir: 'row',
          pad: 'lg',
          gap: 'md',
          align: 'center',
          justify: 'between',
          children: [
            {
              t: 'box',
              dir: 'col',
              gap: 'sm',
              w: '55%',
              children: [
                { t: 'text', role: 'display', text: title, color: 'text' },
                { t: 'bars', lines: 3, widths: [100, 90, 75] },
                {
                  t: 'box',
                  dir: 'row',
                  gap: 'xs',
                  children: [
                    { t: 'button', label: 'Comenzar Ahora', variant: 'solid' },
                    { t: 'button', label: 'Conocer Más', variant: 'outline' },
                  ],
                },
              ],
            },
            {
              t: 'box',
              dir: 'col',
              w: '40%',
              children: [{ t: 'image', ratio: 1.2, icon: 'image' }],
            },
          ],
        };
      }
      if (variant === 2) {
        // Hero fondo completo
        return {
          t: 'box',
          dir: 'col',
          pad: 'xl',
          gap: 'md',
          align: 'center',
          justify: 'center',
          bg: 'secondary',
          children: [
            { t: 'text', role: 'label', text: 'PROPUESTA DE VALOR', color: 'accent' },
            { t: 'text', role: 'display', text: title, align: 'center', color: 'text' },
            { t: 'bars', lines: 2, widths: [80, 60] },
            { t: 'button', label: 'Solicitar Cotización', variant: 'solid' },
          ],
        };
      }
      // Hero centrado (default)
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        align: 'center',
        justify: 'center',
        children: [
          { t: 'text', role: 'display', text: title, align: 'center', color: 'text' },
          { t: 'bars', lines: 2, widths: [85, 70] },
          {
            t: 'box',
            dir: 'row',
            gap: 'sm',
            justify: 'center',
            children: [
              { t: 'button', label: 'Acción Principal', variant: 'solid' },
              { t: 'button', label: 'Ver Detalles', variant: 'outline' },
            ],
          },
        ],
      };

    case 'about':
      if (variant === 1) {
        // Texto centrado
        return {
          t: 'box',
          dir: 'col',
          pad: 'lg',
          gap: 'md',
          align: 'center',
          children: [
            { t: 'text', role: 'label', text: 'NUESTRA HISTORIA', color: 'primary' },
            { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
            { t: 'bars', lines: 4, widths: [95, 90, 85, 60] },
            {
              t: 'box',
              dir: 'row',
              gap: 'md',
              w: '100%',
              justify: 'center',
              children: [
                {
                  t: 'box',
                  dir: 'col',
                  align: 'center',
                  w: '30%',
                  children: [
                    { t: 'text', role: 'h3', text: 'Misión', color: 'text' },
                    { t: 'bars', lines: 2, widths: [90, 70] },
                  ],
                },
                {
                  t: 'box',
                  dir: 'col',
                  align: 'center',
                  w: '30%',
                  children: [
                    { t: 'text', role: 'h3', text: 'Visión', color: 'text' },
                    { t: 'bars', lines: 2, widths: [90, 70] },
                  ],
                },
              ],
            },
          ],
        };
      }
      // Texto + Imagen lateral (default)
      return {
        t: 'box',
        dir: 'row',
        pad: 'lg',
        gap: 'md',
        align: 'center',
        children: [
          {
            t: 'box',
            dir: 'col',
            w: '45%',
            children: [{ t: 'image', ratio: 1.1, icon: 'user' }],
          },
          {
            t: 'box',
            dir: 'col',
            gap: 'sm',
            w: '50%',
            children: [
              { t: 'text', role: 'label', text: 'CONÓCENOS', color: 'primary' },
              { t: 'text', role: 'h2', text: title, color: 'text' },
              { t: 'bars', lines: 4, widths: [100, 95, 90, 70] },
              { t: 'button', label: 'Más de nosotros', variant: 'outline' },
            ],
          },
        ],
      };

    case 'services':
      if (variant === 1) {
        // Lista con íconos
        return {
          t: 'box',
          dir: 'col',
          pad: 'lg',
          gap: 'md',
          children: [
            { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
            {
              t: 'box',
              dir: 'col',
              gap: 'sm',
              children: [1, 2, 3].map((num) => ({
                t: 'box',
                dir: 'row',
                pad: 'sm',
                border: true,
                radius: true,
                align: 'center',
                gap: 'md',
                children: [
                  { t: 'text', role: 'h3', text: `0${num}`, color: 'primary' },
                  {
                    t: 'box',
                    dir: 'col',
                    grow: 1,
                    children: [
                      { t: 'text', role: 'h3', text: `Servicio Especializado 0${num}`, color: 'text' },
                      { t: 'bars', lines: 2, widths: [90, 60] },
                    ],
                  },
                ],
              })),
            },
          ],
        };
      }
      if (variant === 2) {
        // 2 columnas anchas
        return {
          t: 'box',
          dir: 'col',
          pad: 'lg',
          gap: 'md',
          children: [
            { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
            {
              t: 'box',
              dir: 'row',
              gap: 'md',
              children: [1, 2].map((num) => ({
                t: 'box',
                dir: 'col',
                pad: 'md',
                border: true,
                radius: true,
                w: '48%',
                gap: 'xs',
                children: [
                  { t: 'image', ratio: 1.8, icon: 'image' },
                  { t: 'text', role: 'h3', text: `Línea de Solución 0${num}`, color: 'text' },
                  { t: 'bars', lines: 3, widths: [95, 80, 50] },
                  { t: 'button', label: 'Consultar', variant: 'outline' },
                ],
              })),
            },
          ],
        };
      }
      // 3 tarjetas (default)
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'row',
            gap: 'sm',
            children: [1, 2, 3].map((num) => ({
              t: 'box',
              dir: 'col',
              pad: 'sm',
              border: true,
              radius: true,
              w: '31%',
              gap: 'xs',
              children: [
                { t: 'image', ratio: 1.4, icon: 'image' },
                { t: 'text', role: 'h3', text: `Servicio 0${num}`, color: 'text' },
                { t: 'bars', lines: 2, widths: [90, 70] },
                { t: 'button', label: 'Ver más', variant: 'solid' },
              ],
            })),
          },
        ],
      };

    case 'catalog':
      if (variant === 1) {
        // Grilla 4 columnas
        return {
          t: 'box',
          dir: 'col',
          pad: 'lg',
          gap: 'md',
          children: [
            { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
            {
              t: 'box',
              dir: 'row',
              gap: 'xs',
              children: [1, 2, 3, 4].map((num) => ({
                t: 'box',
                dir: 'col',
                pad: 'xs',
                border: true,
                radius: true,
                w: '23%',
                gap: 'xs',
                children: [
                  { t: 'image', ratio: 1.0, icon: 'image' },
                  { t: 'text', role: 'label', text: `Ítem #${num}`, color: 'text' },
                  { t: 'bars', lines: 1, widths: [60] },
                  { t: 'button', label: 'Cotizar', variant: 'solid' },
                ],
              })),
            },
          ],
        };
      }
      // Grilla 3 columnas (default)
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'row',
            gap: 'sm',
            children: [1, 2, 3].map((num) => ({
              t: 'box',
              dir: 'col',
              pad: 'sm',
              border: true,
              radius: true,
              w: '31%',
              gap: 'xs',
              children: [
                { t: 'image', ratio: 1.1, icon: 'image' },
                { t: 'text', role: 'h3', text: `Producto Destacado ${num}`, color: 'text' },
                { t: 'bars', lines: 2, widths: [80, 50] },
                { t: 'button', label: 'Detalles', variant: 'solid' },
              ],
            })),
          },
        ],
      };

    case 'gallery':
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'row',
            gap: 'xs',
            children: [1, 2, 3, 4].map(() => ({
              t: 'box',
              dir: 'col',
              w: '23%',
              children: [{ t: 'image', ratio: 1.0, icon: 'image' }],
            })),
          },
        ],
      };

    case 'process':
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'label', text: 'PASO A PASO', align: 'center', color: 'primary' },
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'row',
            gap: 'sm',
            justify: 'between',
            children: ['1. Contacto', '2. Desarrollo', '3. Entrega'].map((step) => ({
              t: 'box',
              dir: 'col',
              pad: 'sm',
              align: 'center',
              border: true,
              radius: true,
              w: '31%',
              children: [
                { t: 'text', role: 'h3', text: step, color: 'primary' },
                { t: 'bars', lines: 2, widths: [90, 60] },
              ],
            })),
          },
        ],
      };

    case 'stats':
      return {
        t: 'box',
        dir: 'row',
        pad: 'lg',
        gap: 'md',
        bg: 'secondary',
        justify: 'around',
        align: 'center',
        children: [
          { num: '+500', label: 'Proyectos' },
          { num: '99%', label: 'Satisfacción' },
          { num: '8 Años', label: 'Trayectoria' },
        ].map((item) => ({
          t: 'box',
          dir: 'col',
          align: 'center',
          children: [
            { t: 'text', role: 'display', text: item.num, color: 'primary' },
            { t: 'text', role: 'label', text: item.label, color: 'text' },
          ],
        })),
      };

    case 'testimonials':
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'row',
            gap: 'sm',
            children: [1, 2, 3].map((num) => ({
              t: 'box',
              dir: 'col',
              pad: 'sm',
              border: true,
              radius: true,
              w: '31%',
              gap: 'xs',
              children: [
                { t: 'text', role: 'label', text: 'Valoracion 5/5', color: 'accent' },
                { t: 'bars', lines: 3, widths: [95, 80, 70] },
                { t: 'text', role: 'body', text: `Cliente Satisfecho ${num}`, color: 'primary' },
              ],
            })),
          },
        ],
      };

    case 'pricing':
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'row',
            gap: 'sm',
            children: [
              { name: 'Plan Inicial', price: '$90.000', featured: false },
              { name: 'Plan Estándar', price: '$150.000', featured: true },
              { name: 'Plan Premium', price: '$220.000', featured: false },
            ].map((plan) => ({
              t: 'box',
              dir: 'col',
              pad: 'md',
              border: true,
              radius: true,
              w: '31%',
              bg: plan.featured ? 'secondary' : undefined,
              gap: 'xs',
              children: [
                { t: 'text', role: 'h3', text: plan.name, color: 'text' },
                { t: 'text', role: 'display', text: plan.price, color: 'primary' },
                { t: 'bars', lines: 4, widths: [100, 90, 85, 75] },
                { t: 'button', label: 'Elegir Plan', variant: plan.featured ? 'solid' : 'outline' },
              ],
            })),
          },
        ],
      };

    case 'team':
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'row',
            gap: 'sm',
            children: [1, 2, 3].map((num) => ({
              t: 'box',
              dir: 'col',
              align: 'center',
              w: '31%',
              gap: 'xs',
              children: [
                { t: 'image', ratio: 1.0, icon: 'user' },
                { t: 'text', role: 'h3', text: `Profesional ${num}`, color: 'text' },
                { t: 'text', role: 'label', text: 'Especialista / Cargo', color: 'primary' },
              ],
            })),
          },
        ],
      };

    case 'faq':
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'md',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
          {
            t: 'box',
            dir: 'col',
            gap: 'xs',
            children: [1, 2, 3].map((num) => ({
              t: 'box',
              dir: 'col',
              pad: 'sm',
              border: true,
              radius: true,
              children: [
                { t: 'text', role: 'h3', text: `¿Pregunta habitual número ${num}?`, color: 'text' },
                { t: 'bars', lines: 2, widths: [95, 75] },
              ],
            })),
          },
        ],
      };

    case 'cta':
      if (variant === 1) {
        // Caja centrada
        return {
          t: 'box',
          dir: 'col',
          pad: 'xl',
          align: 'center',
          justify: 'center',
          children: [
            {
              t: 'box',
              dir: 'col',
              pad: 'lg',
              border: true,
              radius: true,
              bg: 'secondary',
              align: 'center',
              gap: 'sm',
              w: '80%',
              children: [
                { t: 'text', role: 'h2', text: title, align: 'center', color: 'text' },
                { t: 'bars', lines: 2, widths: [85, 60] },
                { t: 'button', label: 'Contactar Asesor', variant: 'solid' },
              ],
            },
          ],
        };
      }
      // Banda completa (default)
      return {
        t: 'box',
        dir: 'col',
        pad: 'lg',
        gap: 'sm',
        align: 'center',
        justify: 'center',
        bg: 'primary',
        children: [
          { t: 'text', role: 'h2', text: title, align: 'center', color: 'background' },
          { t: 'bars', lines: 1, widths: [60] },
          { t: 'button', label: 'Escríbenos por WhatsApp', variant: 'solid' },
        ],
      };

    case 'contact':
      return {
        t: 'box',
        dir: 'row',
        pad: 'lg',
        gap: 'md',
        children: [
          {
            t: 'box',
            dir: 'col',
            w: '55%',
            gap: 'xs',
            children: [
              { t: 'text', role: 'h2', text: title, color: 'text' },
              { t: 'bars', lines: 1, widths: [80] },
              {
                t: 'box',
                dir: 'col',
                gap: 'xs',
                pad: 'sm',
                border: true,
                radius: true,
                children: [
                  { t: 'text', role: 'label', text: 'Nombre / Empresa', color: 'text' },
                  { t: 'bars', lines: 1, widths: [100] },
                  { t: 'text', role: 'label', text: 'Email o Teléfono', color: 'text' },
                  { t: 'bars', lines: 1, widths: [100] },
                  { t: 'text', role: 'label', text: 'Mensaje o Requerimiento', color: 'text' },
                  { t: 'bars', lines: 2, widths: [100, 70] },
                  { t: 'button', label: 'Enviar Mensaje', variant: 'solid' },
                ],
              },
            ],
          },
          {
            t: 'box',
            dir: 'col',
            w: '40%',
            gap: 'sm',
            children: [
              { t: 'text', role: 'h3', text: 'Información Directa', color: 'text' },
              { t: 'bars', lines: 3, widths: [90, 80, 70] },
              { t: 'image', ratio: 1.4, icon: 'map' },
            ],
          },
        ],
      };

    case 'social':
      return {
        t: 'box',
        dir: 'col',
        pad: 'md',
        gap: 'sm',
        align: 'center',
        children: [
          { t: 'text', role: 'label', text: 'SÍGUENOS EN REDES SOCIALES', color: 'primary' },
          {
            t: 'box',
            dir: 'row',
            gap: 'md',
            justify: 'center',
            children: ['Instagram', 'LinkedIn', 'Facebook'].map((net) => ({
              t: 'box',
              dir: 'row',
              pad: 'xs',
              border: true,
              radius: true,
              children: [{ t: 'text', role: 'body', text: `@${net}`, color: 'text' }],
            })),
          },
        ],
      };

    default:
      return {
        t: 'box',
        dir: 'col',
        pad: 'md',
        children: [{ t: 'text', role: 'body', text: title, color: 'text' }],
      };
  }
}

// Global Navbar Tree
export function getGlobalNavbarTree(variant = 0): WNode {
  if (variant === 1) {
    // Centrado
    return {
      t: 'box',
      dir: 'col',
      pad: 'sm',
      gap: 'xs',
      align: 'center',
      border: true,
      children: [
        { t: 'text', role: 'h3', text: 'LOGOTIPO', color: 'primary' },
        {
          t: 'box',
          dir: 'row',
          gap: 'md',
          children: ['Inicio', 'Servicios', 'Nosotros', 'Contacto'].map((item) => ({
            t: 'text',
            role: 'label',
            text: item,
            color: 'text',
          })),
        },
      ],
    };
  }
  // Logo izquierda + menú derecha (default)
  return {
    t: 'box',
    dir: 'row',
    pad: 'sm',
    align: 'center',
    justify: 'between',
    border: true,
    children: [
      { t: 'text', role: 'h3', text: 'LOGOTIPO', color: 'primary' },
      {
        t: 'box',
        dir: 'row',
        gap: 'md',
        align: 'center',
        children: [
          { t: 'text', role: 'label', text: 'Inicio', color: 'text' },
          { t: 'text', role: 'label', text: 'Servicios', color: 'text' },
          { t: 'text', role: 'label', text: 'Contacto', color: 'text' },
          { t: 'button', label: 'Cotizar', variant: 'solid' },
        ],
      },
    ],
  };
}

// Global Footer Tree
export function getGlobalFooterTree(variant = 0): WNode {
  if (variant === 1) {
    // 3 Columnas
    return {
      t: 'box',
      dir: 'row',
      pad: 'md',
      gap: 'md',
      bg: 'secondary',
      justify: 'between',
      children: [
        {
          t: 'box',
          dir: 'col',
          w: '30%',
          children: [
            { t: 'text', role: 'h3', text: 'EMPRESA', color: 'text' },
            { t: 'bars', lines: 2, widths: [90, 70] },
          ],
        },
        {
          t: 'box',
          dir: 'col',
          w: '30%',
          children: [
            { t: 'text', role: 'label', text: 'ENLACES RÁPIDOS', color: 'primary' },
            { t: 'bars', lines: 3, widths: [80, 60, 75] },
          ],
        },
        {
          t: 'box',
          dir: 'col',
          w: '30%',
          children: [
            { t: 'text', role: 'label', text: 'ATENCIÓN', color: 'primary' },
            { t: 'bars', lines: 2, widths: [85, 50] },
          ],
        },
      ],
    };
  }
  // Simple
  return {
    t: 'box',
    dir: 'row',
    pad: 'sm',
    align: 'center',
    justify: 'between',
    bg: 'secondary',
    children: [
      { t: 'text', role: 'label', text: '© 2026 Todos los derechos reservados.', color: 'text' },
      {
        t: 'box',
        dir: 'row',
        gap: 'sm',
        children: [
          { t: 'text', role: 'label', text: 'Términos', color: 'primary' },
          { t: 'text', role: 'label', text: 'Privacidad', color: 'primary' },
        ],
      },
    ],
  };
}
