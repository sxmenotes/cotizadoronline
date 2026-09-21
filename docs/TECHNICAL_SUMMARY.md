# Technical Summary

## Architecture
- **Framework:** React 18 with Vite.
- **Styling:** Vanilla CSS (no frameworks) using CSS modules and global variable themes.
- **Routing:** React Router v6.
- **State Management:** Zustand (for Auth, Configuration, Quote, and Skeleton states).
- **PDF Generation:** `@react-pdf/renderer` used exclusively for exact vector-based PDF exports (no html2canvas, zero images used for text).
- **Testing:** 
  - Unit/Integration: Vitest + Testing Library.
  - E2E: Playwright.
- **Validation:** Zod schemas.

## Features
- **Authentication:** Password-based access using PBKDF2 hashing stored securely. Session locking for multiple failures.
- **Dynamic Cost Calculator:** Real-time formula calculations for web development quotes.
- **Wireframe Skeleton Simulator:** Interactive didactic visualizer for web structures (Hero, Header, Features) geared towards explaining concepts to clients.
- **PDF Export:** Downloads accurate vector PDFs for quotes and skeletons, avoiding font substitution issues by normalizing font weights and enforcing `Inter` via custom `<PdfText>`.

## Development Workflows
- **Linters:** ESLint, Prettier, Stylelint.
- **Scripts:**
  - `npm run dev`: Local server
  - `npm run build`: Production bundle
  - `npm run test:unit`: Vitest suite
  - `npx playwright test`: E2E suite
