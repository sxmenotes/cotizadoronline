import { z } from 'zod';

export const ProjectTypeSchema = z.enum(['construccion', 'venta']);
export const CurrencyCodeSchema = z.enum(['CLP', 'USD']);
export const QuoteVersionTypeSchema = z.enum(['first', 'revision', 'final']);

export const PlanDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  pages: z.number().int().min(1),
  build: z.object({
    price: z.number().int().min(0),
    desc: z.string(),
  }),
  sale: z.object({
    price: z.number().int().min(0),
    desc: z.string(),
  }),
});

export const SubscriptionDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().min(0),
  desc: z.string(),
});

export const CatalogSchema = z.object({
  schemaVersion: z.literal(1),
  plans: z.array(PlanDefSchema).min(1),
  subscriptions: z.array(SubscriptionDefSchema).min(1),
  hosting: z.object({
    label: z.string().min(1),
    monthlyPrice: z.number().int().min(0),
  }),
  extraPagePrice: z.number().int().min(0),
  depositPercent: z.number().min(0).max(100),
  deliveryBusinessDays: z.number().int().min(1),
});

export const ShowWhenSchema = z
  .object({
    projectType: ProjectTypeSchema.optional(),
  })
  .optional();

export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('paragraph'),
    content: z.string(),
    showWhen: ShowWhenSchema,
  }),
  z.object({
    type: z.literal('list'),
    items: z.array(z.string()),
    showWhen: ShowWhenSchema,
  }),
  z.object({
    type: z.literal('table'),
    rows: z.array(z.array(z.string())),
    showWhen: ShowWhenSchema,
  }),
  z.object({
    type: z.literal('callout'),
    content: z.string(),
    title: z.string().optional(),
    showWhen: ShowWhenSchema,
  }),
  z.object({
    type: z.literal('catalogTable'),
    source: z.enum(['plans', 'subscriptions']),
    showWhen: ShowWhenSchema,
  }),
  z.object({
    type: z.literal('tags'),
    tags: z.array(z.string()),
    showWhen: ShowWhenSchema,
  }),
]);

export const TermsSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  blocks: z.array(ContentBlockSchema),
});

export const TermsPageSchema = z.object({
  pageNumber: z.number().int().min(1),
  sections: z.array(TermsSectionSchema),
});

export const TermsContentSchema = z.object({
  pages: z.array(TermsPageSchema),
});

export const IssuerSchema = z.object({
  name: z.string().min(1),
  brandSubtitle: z.string(),
  documentTag: z.string(),
  serviceTagline: z.string(),
  footerBrand: z.string(),
  bankDetails: z.array(z.string()),
  contact: z.array(z.string()),
});

export const QuoteSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  client: z.string().min(1, 'El nombre del cliente es obligatorio').max(80),
  project: z.string().min(1, 'El nombre del proyecto es obligatorio').max(80),
  prototypeUrl: z.string().url().optional().or(z.literal('')),
  versionType: QuoteVersionTypeSchema,
  versionNote: z.string().max(120).optional(),
  projectType: ProjectTypeSchema,
  planId: z.string().min(1),
  extraPages: z.number().int().min(0).max(50),
  subscriptionId: z.string().min(1),
  hosting: z.boolean(),
  currency: CurrencyCodeSchema,
  exchangeRate: z.number().positive().optional(),
  exchangeNote: z.string().optional(),
  catalog: CatalogSchema,
  terms: TermsContentSchema,
  issuer: IssuerSchema,
  linkedSkeletonId: z.string().optional(),
  includeSkeletonInPdf: z.boolean().optional(),
});

export const HexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export const SkeletonSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'navbar',
    'footer',
    'hero',
    'about',
    'services',
    'catalog',
    'gallery',
    'process',
    'stats',
    'testimonials',
    'pricing',
    'team',
    'faq',
    'cta',
    'contact',
    'social',
  ]),
  variant: z.number().int().min(0),
  label: z.string().max(40),
});

export const SkeletonPageSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(24),
  sections: z.array(SkeletonSectionSchema).max(10, 'Máximo 10 secciones por página'),
});

export const SkeletonDesignSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  project: z.object({
    client: z.string().max(80),
    project: z.string().max(80),
    linkedQuoteId: z.string().optional(),
    manualPageLimit: z.number().int().min(1).max(12),
  }),
  palette: z.object({
    primary: z.string().regex(HexColorRegex, 'Color primario hex inválido'),
    secondary: z.string().regex(HexColorRegex, 'Color secundario hex inválido'),
    background: z.string().regex(HexColorRegex, 'Color de fondo hex inválido'),
    text: z.string().regex(HexColorRegex, 'Color de texto hex inválido'),
    accent: z.string().regex(HexColorRegex, 'Color de acento hex inválido'),
    presetId: z.string(),
  }),
  typography: z.object({
    headingFont: z.string().min(1),
    bodyFont: z.string().min(1),
    scale: z.enum(['compact', 'normal', 'wide']),
  }),
  style: z.object({
    radius: z.enum(['square', 'soft', 'round']),
    density: z.enum(['compact', 'normal', 'wide']),
  }),
  global: z.object({
    navbar: z.object({
      enabled: z.boolean(),
      variant: z.number().int().min(0),
    }),
    footer: z.object({
      enabled: z.boolean(),
      variant: z.number().int().min(0),
    }),
  }),
  pages: z.array(SkeletonPageSchema).min(1),
  notes: z.string().max(400),
});
