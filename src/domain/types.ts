export type ProjectType = 'construccion' | 'venta';
export type CurrencyCode = 'CLP' | 'USD';
export type QuoteVersionType = 'first' | 'revision' | 'final';

export interface PlanDef {
  id: string;
  name: string;
  pages: number;
  build: { price: number; desc: string };
  sale: { price: number; desc: string };
}

export interface SubscriptionDef {
  id: string;
  name: string;
  price: number;
  desc: string;
}

export interface Catalog {
  schemaVersion: 1;
  plans: PlanDef[];
  subscriptions: SubscriptionDef[];
  hosting: { label: string; monthlyPrice: number };
  extraPagePrice: number;
  depositPercent: number;
  deliveryBusinessDays: number;
}

export type ContentBlock =
  | { type: 'paragraph'; content: string; showWhen?: { projectType?: ProjectType | undefined } | undefined }
  | { type: 'list'; items: string[]; showWhen?: { projectType?: ProjectType | undefined } | undefined }
  | { type: 'table'; rows: string[][]; showWhen?: { projectType?: ProjectType | undefined } | undefined }
  | { type: 'callout'; content: string; title?: string | undefined; showWhen?: { projectType?: ProjectType | undefined } | undefined }
  | { type: 'catalogTable'; source: 'plans' | 'subscriptions'; showWhen?: { projectType?: ProjectType | undefined } | undefined }
  | { type: 'tags'; tags: string[]; showWhen?: { projectType?: ProjectType | undefined } | undefined };

export interface TermsSection {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

export interface TermsPage {
  pageNumber: number;
  sections: TermsSection[];
}

export interface TermsContent {
  pages: TermsPage[];
}

export interface Issuer {
  name: string;
  brandSubtitle: string;
  documentTag: string;
  serviceTagline: string;
  footerBrand: string;
  bankDetails: string[];
  contact: string[];
}

export interface Quote {
  id: string;
  createdAt: string;
  updatedAt: string;
  issuedOn: string;
  client: string;
  project: string;
  prototypeUrl?: string | undefined;
  versionType: QuoteVersionType;
  versionNote?: string | undefined;
  projectType: ProjectType;
  planId: string;
  extraPages: number;
  subscriptionId: string;
  hosting: boolean;
  currency: CurrencyCode;
  exchangeRate?: number | undefined;
  exchangeNote?: string | undefined;
  catalog: Catalog;
  terms: TermsContent;
  issuer: Issuer;
  linkedSkeletonId?: string | undefined;
  includeSkeletonInPdf?: boolean | undefined;
}

export type SectionType =
  | 'navbar'
  | 'footer'
  | 'hero'
  | 'about'
  | 'services'
  | 'catalog'
  | 'gallery'
  | 'process'
  | 'stats'
  | 'testimonials'
  | 'pricing'
  | 'team'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'social';

export interface SkeletonSection {
  id: string;
  type: SectionType;
  variant: number;
  label: string;
}

export interface SkeletonPage {
  id: string;
  name: string;
  sections: SkeletonSection[];
}

export interface SkeletonDesign {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  project: {
    client: string;
    project: string;
    linkedQuoteId?: string | undefined;
    manualPageLimit: number;
  };
  palette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    presetId: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: 'compact' | 'normal' | 'wide';
  };
  style: {
    radius: 'square' | 'soft' | 'round';
    density: 'compact' | 'normal' | 'wide';
  };
  global: {
    navbar: { enabled: boolean; variant: number };
    footer: { enabled: boolean; variant: number };
  };
  pages: SkeletonPage[];
  notes: string;
}
