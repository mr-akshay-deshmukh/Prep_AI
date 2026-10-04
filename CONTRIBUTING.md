# 🤝 Contributing to PrepAI

Thank you for your interest in contributing to **PrepAI**! We welcome bug fixes, documentation improvements, new interview scenarios, UI enhancements, and feature suggestions from engineers of all experience levels.

---

## 📋 Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Branching Strategy](#branching-strategy)
5. [Commit Message Guidelines](#commit-message-guidelines)
6. [Code Style & Standards](#code-style--standards)
7. [Submitting a Pull Request](#submitting-a-pull-request)
8. [Reporting Issues](#reporting-issues)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by the [PrepAI Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this standard.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or later)
- [npm](https://www.npmjs.com/) (version 9 or later) or `bun`
- A free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Local Setup
1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/prepai.git
   cd prepai
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` into `.env`.
5. **Launch development server**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000`.

---

## 🔄 Development Workflow

- Always ensure your branch is up-to-date with `main` before starting work:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b <type>/<short-description>
  ```
- Before pushing your changes, run TypeScript type check & lint:
  ```bash
  npm run lint
  ```
- Verify the production build succeeds without issues:
  ```bash
  npm run build
  ```

---

## 🌿 Branching Strategy

We use conventional branch naming:
- `feat/feature-name` — for new features
- `fix/bug-description` — for bug fixes
- `docs/doc-updates` — for documentation additions or changes
- `refactor/scope` — for code refactoring with no behavior changes
- `chore/task` — for dependency upgrades, build scripts, or repo maintenance

---

## ✍️ Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types:
- `feat`: A new feature (e.g. `feat(streak): add sound effects for milestone unlock`)
- `fix`: A bug fix (e.g. `fix(audio): handle speech recognition disconnect gracefully`)
- `docs`: Documentation changes only (e.g. `docs(readme): add troubleshooting section`)
- `style`: Changes that do not affect the meaning of the code (formatting, white-space)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, tooling, or libraries

---

## 🎨 Code Style & Standards

- **TypeScript**:
  - Keep types explicit; avoid `any` wherever possible.
  - Define clear interfaces in `src/types/` or modular types in respective component files.
- **Styling**:
  - Use Tailwind CSS utility classes exclusively.
  - Respect responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
  - Use high-contrast accessible color combinations.
- **Architecture**:
  - Keep components modular and single-responsibility.
  - Maintain server-side proxy patterns for LLM requests (`/api/gemini/*`) to ensure client security.

---

## 📬 Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/my-new-feature
   ```
2. Navigate to your fork on GitHub and click **"Compare & pull request"**.
3. Fill out the PR template completely:
   - Provide a concise summary of changes.
   - Attach screenshots or GIFs for UI modifications.
   - Reference any related issues (e.g., `Closes #42`).
4. Ensure all CI checks (linting, build) pass.
5. Address reviewer comments promptly.

---

## 🐛 Reporting Issues

- **Bug Reports**: Use our [Bug Report Template](./.github/ISSUE_TEMPLATE/bug_report.md). Include steps to reproduce, expected behavior, actual behavior, and relevant console logs.
- **Feature Requests**: Use our [Feature Request Template](./.github/ISSUE_TEMPLATE/feature_request.md). Explain the user problem and the proposed solution.

---

Thank you for helping make PrepAI the best interview prep tool for engineers! 🎉
