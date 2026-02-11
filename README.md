# 🌌 AIOrbit

AIOrbit is a premium **Personal AI Command Center** designed for entrepreneurs, developers, and knowledge workers to manage their expanding AI ecosystem. It provides a centralized dashboard to track tool usage, spending, goals, and strategic decisions.

---

## ✨ Key Features

### 🚀 Command Center Dashboard
Get a high-level overview of your AI health. Real-time metrics on total tools, monthly spend, active goals, and your decision-making track record.

### 🛠️ AI Tool Registry
Catalog every AI tool in your arsenal. Track monthly costs, data access levels (none/limited/full), and current status (active/paused/trial).

### 🎨 Tool Ecosystem Map
Visualize the relationship between your AI tools and your personal goals. An interactive SVG orbit visualization that highlights how your stack supports your objectives.

### 🧭 AI Tools Directory
Discover and manage the best AI services in the industry. Features a curated list of top tools with real-time pricing and one-click "Add to Registry" integration.

### 🎯 Goal Milestones
Set high-level objectives and break them down into granular milestones. track progress with interactive checkboxes and auto-calculating completion rates.

### 📖 Decision Journal
Log strategic decisions influenced by AI. Attribute tools to specific outcomes and build a historical record of your decision quality.

### 📈 Analytics & Risk Guidance
Visual spending charts and category breakdowns. Includes smart risk assessment to identify tool overlap and data privacy concerns.

### 📱 Responsive & Fast
Fully optimized for mobile with a slide-in navigation system and instant navigation via the **Ctrl+K Command Palette**.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Modules) with Premium Dark-First Design
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data**: Privacy-first local storage (JSON)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm / yarn / pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/aiorbit.git
   cd aiorbit
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Data**:
   Ensure the `data/` directory exists and has a valid `db.json`. You can use the provided template:
   ```bash
   mkdir data
   cp data/db.json.example data/db.json
   ```

4. **Launch AIOrbit**:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to enter your command center.

---

## 🔒 Data Privacy

AIOrbit is built with local-first principles. Your tool registry, goal history, and decision logs are stored in `data/db.json`. This file is ignored by Git by default to ensure your personal data never leaves your machine unless you explicitly use the built-in **Export** feature.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///C:/Projects/aiorbit/LICENSE) file for details.
