import type { Catalog, CurrencyCode } from './types';
import { formatCurrency, roundHalfUp } from './pricing';

export interface TokenContext {
  catalog: Catalog;
  currency: CurrencyCode;
  exchangeRate?: number;
}

export const TOKEN_REGEX = /\{\{([^}]+)\}\}/g;

export interface TokenValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTokens(text: string, catalog: Catalog): TokenValidationResult {
  const errors: string[] = [];
  const matches = Array.from(text.matchAll(TOKEN_REGEX));

  for (const match of matches) {
    const rawToken = match[1]?.trim();
    if (!rawToken) {
      errors.push('Token vacío encontrado');
      continue;
    }

    if (rawToken === 'hosting' || rawToken === 'extraPage' || rawToken === 'deposit%' || rawToken === 'days') {
      continue;
    }

    if (rawToken.startsWith('build:')) {
      const planId = rawToken.slice(6);
      if (!catalog.plans.some((p) => p.id === planId)) {
        errors.push(`Plan inexistente en token: ${rawToken}`);
      }
      continue;
    }

    if (rawToken.startsWith('sale:')) {
      const planId = rawToken.slice(5);
      if (!catalog.plans.some((p) => p.id === planId)) {
        errors.push(`Plan inexistente en token: ${rawToken}`);
      }
      continue;
    }

    if (rawToken.startsWith('sub:')) {
      const subId = rawToken.slice(4);
      if (!catalog.subscriptions.some((s) => s.id === subId)) {
        errors.push(`Suscripción inexistente en token: ${rawToken}`);
      }
      continue;
    }

    if (rawToken.startsWith('pages:')) {
      const planId = rawToken.slice(6);
      if (!catalog.plans.some((p) => p.id === planId)) {
        errors.push(`Plan inexistente en token: ${rawToken}`);
      }
      continue;
    }

    errors.push(`Token desconocido: {{${rawToken}}}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function resolveTokens(text: string, context: TokenContext): string {
  const { catalog, currency, exchangeRate } = context;

  const formatAmount = (clp: number): string => {
    if (currency === 'CLP') {
      return formatCurrency(clp, 'CLP');
    }
    const rate = exchangeRate && exchangeRate > 0 ? exchangeRate : 950;
    const minor = roundHalfUp((clp / rate) * 100);
    return formatCurrency(minor, 'USD');
  };

  return text.replace(TOKEN_REGEX, (_, rawToken) => {
    const token = String(rawToken).trim();

    if (token === 'hosting') {
      return formatAmount(catalog.hosting.monthlyPrice);
    }
    if (token === 'extraPage') {
      return formatAmount(catalog.extraPagePrice);
    }
    if (token === 'deposit%') {
      return `${catalog.depositPercent}%`;
    }
    if (token === 'days') {
      return `${catalog.deliveryBusinessDays}`;
    }

    if (token.startsWith('build:')) {
      const planId = token.slice(6);
      const plan = catalog.plans.find((p) => p.id === planId);
      return plan ? formatAmount(plan.build.price) : `{{${token}}}`;
    }

    if (token.startsWith('sale:')) {
      const planId = token.slice(5);
      const plan = catalog.plans.find((p) => p.id === planId);
      return plan ? formatAmount(plan.sale.price) : `{{${token}}}`;
    }

    if (token.startsWith('sub:')) {
      const subId = token.slice(4);
      const sub = catalog.subscriptions.find((s) => s.id === subId);
      return sub ? formatAmount(sub.price) : `{{${token}}}`;
    }

    if (token.startsWith('pages:')) {
      const planId = token.slice(6);
      const plan = catalog.plans.find((p) => p.id === planId);
      return plan ? `${plan.pages}` : `{{${token}}}`;
    }

    return `{{${token}}}`;
  });
}
