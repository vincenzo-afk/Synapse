# Contributing to Synapse

Thank you for your interest in contributing to Synapse! We are building a private, local-first personal operating system, and we value contributions that respect our core architectural principles.

## 🏗️ Core Principles

Before you start, please ensure your contribution adheres to these non-negotiable rules:
- **Local First:** No data should ever leave the user's browser without explicit export.
- **Privacy First:** No telemetry, analytics beacons, or third-party scripts.
- **Offline First:** The app must be fully functional with zero network access.
- **No AI/Cloud Dependency:** Do not introduce LLM calls or cloud-based services.

## 🚀 Getting Started

1. **Read the Docs:** Familiarize yourself with `AGENTS.md` and the `docs/` folder.
2. **Setup:** Follow the installation steps in the `README.md`.
3. **Branching:** Create a feature branch from `main`.
4. **Code Style:** We use TypeScript in strict mode. Ensure `npm run lint` passes.
5. **Testing:** Verify your changes survive a page reload and work offline.

## 📬 Pull Request Process

1. Update the `CHANGELOG.md` with your changes.
2. Ensure your PR description clearly states the problem it solves.
3. If you are adding a new module, ensure it follows the "Definition of Done" in `AGENTS.md`.

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.
