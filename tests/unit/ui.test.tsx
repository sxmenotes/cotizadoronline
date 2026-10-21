import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Button, Input, NumberStepper, Badge, SectionHeader, ConfirmDialog } from '../../src/ui';
import { AppShell } from '../../src/app/AppShell';

describe('Sistema de Diseño - Componentes UI', () => {
  it('renderiza Button con texto y variante primaria', () => {
    render(<Button variant="primary">Guardar Cotización</Button>);
    const btn = screen.getByRole('button', { name: /Guardar Cotización/i });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('bg-navy-700');
  });

  it('renderiza Input con etiqueta y mensaje de error accesible', () => {
    render(<Input label="Nombre del Cliente" error="Campo obligatorio" />);
    expect(screen.getByLabelText(/Nombre del Cliente/i)).toBeDefined();
    expect(screen.getByText(/Campo obligatorio/i)).toBeDefined();
  });

  it('renderiza NumberStepper y maneja valores', () => {
    let val = 2;
    const { rerender } = render(
      <NumberStepper
        value={val}
        onChange={(n) => {
          val = n;
        }}
        label="Páginas Adicionales"
      />
    );
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByLabelText('Disminuir')).toBeDefined();
    expect(screen.getByLabelText('Aumentar')).toBeDefined();

    rerender(
      <NumberStepper
        value={3}
        onChange={(n) => {
          val = n;
        }}
        label="Páginas Adicionales"
      />
    );
    expect(screen.getByText('3')).toBeDefined();
  });

  it('renderiza Badge con estilos correctos', () => {
    render(<Badge variant="brass">Revisión 2</Badge>);
    const badge = screen.getByText('Revisión 2');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('bg-brass-100');
  });

  it('renderiza SectionHeader con título serif y eyebrow', () => {
    render(
      <SectionHeader
        eyebrow="Propuesta Comercial"
        title="Inversión Inicial"
        description="Desglose de valores"
      />
    );
    expect(screen.getByText('Propuesta Comercial')).toBeDefined();
    expect(screen.getByText('Inversión Inicial')).toBeDefined();
    expect(screen.getByText('Desglose de valores')).toBeDefined();
  });

  it('renderiza AppShell con accesos y navegación accesible', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    // Debe contener el nombre de marca
    expect(screen.getByText('SAMUEL VALENZUELA')).toBeDefined();
    // Debe contener los accesos de navegación
    expect(screen.getAllByText('Historial').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Presupuestos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Esqueleto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ajustes').length).toBeGreaterThan(0);
  });

  it('renderiza ConfirmDialog mostrando su contenido infantil (children) y botones de acción', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Editar Plan"
        description="Ajuste los valores"
        confirmLabel="Guardar"
        onConfirm={() => {}}
      >
        <div data-testid="plan-form-inputs">
          <input placeholder="Nombre del Plan" />
        </div>
      </ConfirmDialog>
    );

    expect(screen.getByText('Editar Plan')).toBeDefined();
    expect(screen.getByText('Ajuste los valores')).toBeDefined();
    expect(screen.getByTestId('plan-form-inputs')).toBeDefined();
    expect(screen.getByPlaceholderText('Nombre del Plan')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDefined();
  });
});
