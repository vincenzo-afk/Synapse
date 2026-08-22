# Synapse OS 🧠

**Synapse** is a unified, local-first personal operating system designed for high-performance individuals who value privacy and simplicity. It brings together habit tracking, task management, finance, journaling, and more into a single, cohesive, and fully offline-capable Progressive Web App (PWA).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2019-61DAFB?logo=react)](https://react.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-7c6af7?logo=pwa)](https://web.dev/progressive-web-apps/)
[![Offline First](https://img.shields.io/badge/Offline-First-success)](https://web.dev/offline-first/)

---

## 🚀 Vision

Synapse is built on the belief that your personal data should belong to you, and your productivity tools should work wherever you are, without relying on the cloud, subscriptions, or AI.

- **Local First:** All data stays in your browser's IndexedDB.
- **Privacy First:** Zero telemetry, zero analytics, zero third-party scripts.
- **Offline First:** Fully functional with no internet connection.
- **Neo-Brutalist Design:** A bold, high-contrast, and tactile user interface.

---

## 🛠️ Feature Modules

Synapse unifies over 15+ modules into one coherent experience:

- **Habits & Tasks:** Binary/value habits with streaks and a full Kanban task manager.
- **Health & Wellness:** Hydration tracking, nutrition logging, and sleep analysis.
- **Finance & CRM:** Ledger-based expense tracking and a personal relationship manager.
- **Learning & Work:** Study planner, college semester tracker, and project management.
- **Mindfulness:** Daily journaling with mood tracking and a secure vault.
- **Insights:** Cross-module analytics and a unified calendar view.

---

## 🏗️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Database:** [Dexie.js](https://dexie.org/) (IndexedDB Wrapper)
- **State:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)

---

## 📥 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [pnpm](https://pnpm.io/) or `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vincenzo-afk/Synapse.git
   cd Synapse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 📖 Documentation for Developers

This project is built with a strict "Build Contract" to ensure architectural integrity.

- **[AGENTS.md](AGENTS.md):** The primary contract for AI coding agents and contributors.
- **[ROADMAP.md](ROADMAP.md):** High-level build progress and future goals.
- **[Docs Folder](docs/):** Detailed specifications for architecture, data models, and every module.

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions that align with our core principles of privacy and local-first architecture. Please read our [AGENTS.md](AGENTS.md) for architectural constraints before submitting a PR.

---

*Built with ❤️ for the independent web.*
