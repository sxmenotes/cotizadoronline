# Creador Presupuestos v2.0

Generador avanzado de presupuestos y arquitectura web interactiva (Esqueleto). Esta herramienta ayuda a agencias y freelancers a cotizar rápidamente y explicar didácticamente a los clientes las secciones y anatomía de un desarrollo web (Hero, Header, Features, Footer, etc).

## Características Principales
- 💰 **Presupuestos Rápidos:** Fórmulas dinámicas para calcular costos precisos.
- 🏗️ **Simulador Didáctico:** Generador de "esqueletos" web que permite a los clientes visualizar y entender la estructura de su sitio (sin diseño, solo layout).
- 📄 **Exportación a PDF 100% Vectorial:** Motor basado en `@react-pdf/renderer` para asegurar textos seleccionables y alta resolución sin `html2canvas`.
- 🔒 **Acceso Seguro:** Autenticación por contraseña para proteger las cotizaciones.

## Tecnologías y Stack
- **Framework:** React 18, Vite.
- **Estilos:** Vanilla CSS (CSS Modules y Variables Globales) sin Tailwind.
- **Estado Global:** Zustand.
- **Rutas:** React Router v6.
- **PDF Engine:** `@react-pdf/renderer`.
- **Testing:** Vitest (Unitario) y Playwright (E2E).

## Iniciar el Proyecto (Desarrollo)
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Ejecutar entorno de desarrollo:
   ```bash
   npm run dev
   ```

## Iniciar en Producción
Para compilar y correr el servidor de vista previa localmente, puedes usar:
```bash
ALLOW_DEV_PASSWORD=1 npm run build
ALLOW_DEV_PASSWORD=1 npm run preview
```
(El flag `ALLOW_DEV_PASSWORD=1` permite usar la contraseña `samu1234` temporalmente).

## Testing
- Unitario: `npm run test:unit`
- E2E: `npx playwright test`

## Documentación Adicional
- [Resumen Técnico](docs/TECHNICAL_SUMMARY.md)
- [Modelo de Negocio](docs/NEGOCIO.md)
