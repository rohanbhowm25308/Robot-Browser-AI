#  Robot Browser AI

<div align="center">

### The Next Generation of Intelligent Browsing

**Browse Smarter. Automate Faster. Verify Everything.**

An AI-native browser workspace that combines autonomous web automation, intelligent agents, multimodal AI assistance, research workflows, and document integrity analysis into one unified platform.

**Built for HackBriven Build Arena | Developed with AdaL by Sylph**

[![Python](https://img.shields.io/badge/Python-Backend-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Automation-2EAD33?style=flat-square)](https://playwright.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-7C3AED?style=flat-square)](https://langchain-ai.github.io/langgraph/)

**[🌐 Live Website](https://robot-browser-ai.onrender.com/) | [💻 Source Code](https://github.com/rohanbhowm25308/Robot-Browser-AI) |**

</div>

---

## 🌟 Overview

Traditional browsers help users access information. **Robot Browser AI goes a step further by helping users take action on that information.**

Instead of manually navigating websites, collecting research, creating spreadsheets, and reviewing documents, users can describe their goals in natural language and work with AI-powered tools.

Robot Browser AI brings together:

- Autonomous browser agents powered by Playwright.
- Intelligent task planning and multi-agent collaboration.
- Research-to-Excel automation.
- Evidence-based task verification.
- Voice, image, and screenshot assistance.
- AI-powered code analysis and debugging.
- **BUSTED AI**, a document and data integrity investigation engine.
- User approvals, recovery workflows, and mission history.

The platform is designed around a simple principle:

> **AI should not only suggest what to do. It should help execute tasks, show evidence, and keep the user in control.**

---

### 🌐 Experience Robot Browser AI

The hosted application provides access to the Robot Browser AI workspace and supported cloud-compatible features.

**Important:** The hosted Render version and the desktop application have different capabilities. Full interactive Chromium automation requires the appropriate local desktop environment. On the standard Render deployment, browser-agent and Chromium-snapshot functionality may be disabled.

For the complete local browser automation experience, follow the desktop installation instructions below.

---

## ✨ Key Features

### 1.  Autonomous Browser Agent

An intelligent browser automation system designed to interpret user instructions and interact with websites.

**Capabilities:**
- Natural-language task instructions.
- Playwright-powered browser navigation.
- Page observation and action planning.
- Multi-step task execution.
- DOM and page-content inspection.
- User approval for sensitive actions.
- Outcome verification using available evidence.

The browser agent follows an iterative workflow:

**Observe → Plan → Act → Verify → Continue**

### 2.  AI Task Planner

Converts user goals into structured execution plans.

- Breaks complex tasks into manageable steps.
- Identifies required tools and resources.
- Presents execution plans for review.
- Tracks progress through mission stages.
- Supports configurable task limits.

### 3.  Proof-of-Work Engine

Designed to make AI automation more transparent.

Instead of reporting success based only on generated text, the system records available execution evidence.

- Source URLs and timestamps.
- Browser action history.
- Page-content evidence.
- HTTP and DOM-based verification.
- Downloaded-file checks.
- Mission status and failure reasons.

Verification is limited to evidence the system can actually observe.

### 4.  Phoenix Recovery Engine

Helps missions recover from interruptions and failures.

- Retry handling.
- Alternative-source selection.
- Incomplete-task reporting.
- Mission continuation from checkpoints.
- Error tracking and recovery information.

### 5.  Ghost Twin Browser

Preview-oriented workflow for safer task execution.

- Review planned actions.
- Inspect potential risks.
- Approve execution before proceeding.
- Maintain user control over consequential actions.

### 6.  AI Council Mode

A collaborative agent workflow built around research quality and verification.

**Researcher Agent:** Collects and structures information.

**Critic Agent:** Identifies incomplete, uncertain, or questionable findings.

**Verifier Agent:** Checks available evidence and generated outputs.

The research workflow uses LangGraph for multi-stage orchestration.

### 7.  Research-to-Excel Automation

Turn a research request into a structured spreadsheet workflow.

**Example task:**

> Research five AI startups, collect their websites and publicly available product information, and organize the results into an Excel workbook.

**Workflow:**

1. Understand the research goal.
2. Generate a task plan.
3. Request execution approval.
4. Search and inspect relevant sources.
5. Extract structured information.
6. Generate an Excel workbook.
7. Reopen the workbook for validation.
8. Provide the resulting file and execution evidence.

### 8.  Multimodal AI Companion

Interact with Robot Browser AI using multiple input methods.

- Natural-language chat.
- Voice input.
- Screenshot-based assistance.
- Image understanding.
- File-based analysis.
- Contextual task suggestions.

Voice processing and vision capabilities use supported AI integrations.

### 9.  Code Surgeon

An AI-assisted code investigation and debugging workspace.

**Capabilities:**
- Code explanation.
- Bug identification.
- Suggested fixes.
- Code-difference previews.
- Python syntax validation.
- Optional before-and-after test execution.

**Security note:** Optional code execution is not a hardened sandbox. Only run trusted code in a controlled local environment.

### 10.  GTM Launch Architect

An AI assistant for go-to-market research and planning.

- Market research.
- Competitor analysis.
- Audience identification.
- Positioning ideas.
- Marketing strategies.
- Launch-plan generation.

### 11.  Mission Replay, History & Forking

Keep track of automation workflows.

- Mission execution history.
- Recorded actions and outcomes.
- Mission continuation.
- Forking workflows with revised assumptions.
- Error and verification logs.

### 12.  Trust Radar & Agent Memory

Additional tools for responsible AI browsing.

**Trust Radar**
- Website security indicators.
- Suspicious URL detection.
- Prompt-injection risk signals.
- Look-alike and questionable-content warnings.

**Agent Memory**
- Optional local memory.
- User-controlled settings.
- Deletable stored context.

---

##  BUSTED AI — Document & Data Integrity Engine

### Upload. Investigate. Detect. Correct. Verify.

**BUSTED AI** is a document investigation and validation feature built into Robot Browser AI.

It helps users identify inconsistencies, questionable claims, calculation errors, and data-quality problems.

###  Supported Formats

| Format | Analysis |
|---|---|
| PDF | Text extraction and claim investigation |
| CSV | Structured data validation |
| Excel | Spreadsheet consistency and arithmetic checks |
| DOCX | Document text and claim analysis |
| TXT | Text-based investigation |
| Images | AI-assisted content examination |

###  Detection Capabilities

- Missing and duplicate values.
- Arithmetic inconsistencies.
- Unexpected outliers.
- Data-quality problems.
- Suspicious claims requiring review.
- Evidence-backed factual contradictions where reliable sources are available.

###  Verification Signals

| Signal | Meaning |
|---|---|
| 🟢 Green | Applicable validation checks passed |
| 🔴 Red | Confirmed inconsistency or error |
| 🟡 Yellow | Suspicious finding requiring investigation |
| ⚪ Gray | Insufficient evidence to verify |

**Important:** BUSTED AI does not guarantee that a document is genuine or legally authentic. Its findings describe the results of specific automated checks and available evidence.

###  Intelligent Correction Workflow

**Upload → Analyze → Identify Issues → Review Corrections → Recheck → Generate Report**

BUSTED AI can suggest corrections and rerun applicable validation checks after changes.

A corrected validation result does not independently establish the authenticity of the original document.

---

## 🏗️ System Architecture

```text
                   ROBOT BROWSER AI
                          |
            +-------------+-------------+
            |                           |
       Web Interface               Electron App
       HTML / CSS / JS             Desktop Shell
            |                           |
            +-------------+-------------+
                          |
                    Flask Backend
                          |
        +-----------------+-----------------+
        |                 |                 |
   AI Orchestration   Browser Engine   File Processing
        |                 |                 |
   Groq + LangGraph     Playwright      Pandas / PyMuPDF
        |                 |                 |
   Planning / Council  Navigation       OpenPyXL / DOCX
        |                 |                 |
        +-----------------+-----------------+
                          |
               Verification & Security
                          |
             NetGuard / Trust Radar
                          |
                  SQLite Storage
                          |
               Missions / Evidence
```

---

##  Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Desktop Application | Electron, Node.js |
| Backend | Python, Flask |
| AI Integration | Groq API |
| Agent Orchestration | LangGraph |
| Browser Automation | Playwright, Chromium |
| Data Processing | Pandas |
| Excel Processing | OpenPyXL |
| PDF Processing | PyMuPDF |
| Document Processing | python-docx |
| Web Parsing | Beautiful Soup |
| Database | SQLite |
| Testing | Pytest |
| Cloud Deployment | Render |
| AI Development Assistance | AdaL by Sylph |

---

##  Installation & Setup

### Prerequisites

- Python 3.12 or a compatible version.
- Node.js and npm for Electron.
- Git.
- A Groq API key for AI-powered functionality.
- Playwright Chromium for local browser automation.

### Step 1 — Clone the Repository

```bash
git clone https://github.com/rohanbhowm25308/Robot-Browser-AI.git
cd Robot-Browser-AI
```

### Step 2 — Create a Virtual Environment

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Install Playwright Chromium

```bash
python -m playwright install chromium
```

### Step 5 — Configure Environment Variables

Copy `.env.example` to `.env` and configure the required values.

For example:

```env
GROQ_API_KEY=your_groq_api_key_here
APP_PASSWORD=your_local_password
```

Use the existing `.env.example` as the authoritative reference for additional configuration.

Never commit real API keys, passwords, or session secrets.

### Step 6 — Start the Backend

```bash
python app.py
```

The local application uses a one-time launch link for authenticated access. Follow the link printed by the application.

### Step 7 — Launch the Electron Desktop App

Open another terminal:

```bash
cd electron
npm install
npm start
```

The desktop application launches Robot Browser AI in its Electron window.

---

##  Automated Testing

Robot Browser AI includes an automated test suite covering important security, workflow, and validation behavior.

Install test dependencies:

```bash
pip install -r requirements-dev.txt
```

Run the test suite:

```bash
python -m pytest -q
```

### Test Coverage Areas

- Authentication and session handling.
- Network request safeguards.
- Browser automation approvals.
- Task verification criteria.
- Agent recovery and continuation.
- Research and spreadsheet validation.
- BUSTED AI checks and corrections.
- Code Surgeon validation.
- Electron URL security.
- Frontend consistency.

The repository documents **71 test cases**. Actual pass, fail, and skip counts depend on the installed dependencies and test environment.

Automated tests supplement, but do not replace, live browser and AI integration testing.

---

## 🔐 Security & Responsible Automation

Robot Browser AI is designed to keep users informed and in control of automated actions.

Key safeguards include:

- Local session authentication.
- Approval checkpoints for sensitive browser actions.
- Restrictions on password and payment-field interactions.
- Network request validation.
- Private-address and redirect protections.
- Controlled external-link opening.
- Mission cancellation and recovery.
- Evidence-based completion reporting.
- Rate limits for public demo mode.

**Limitations:** AI outputs may contain errors. Web verification cannot always establish real-world outcomes, and code execution must not be treated as securely sandboxed.

---

##  Cloud Deployment

Robot Browser AI is deployed on Render.

**Live Demo:** https://robot-browser-ai.onrender.com/

The hosted version is designed for accessible web-based demonstrations, including supported research, chat, analysis, and BUSTED AI workflows.

### Hosted vs. Desktop

| Capability | Hosted Web Demo | Local Desktop |
|---|---|---|
| AI Chat | Supported with configuration | Supported |
| BUSTED AI | Supported | Supported |
| Research Workflows | Supported with hosted limitations | Supported |
| Code Analysis | Supported with limitations | Supported |
| Full Chromium Browser Agent | Not available in standard hosted configuration | Available |
| Electron Desktop Window | No | Yes |

Some capabilities depend on configured API keys, installed browser binaries, and runtime resources.

---

##  Developed with AdaL by Sylph

Robot Browser AI was developed with assistance from **AdaL by Sylph**, used as an AI development tool rather than a required application runtime dependency.

AdaL-assisted development activities include project inspection, code analysis, environment setup, and test-workflow assistance.

The development workflow emphasizes:

1. Reviewing the existing codebase.
2. Identifying implementation risks.
3. Checking project dependencies.
4. Running automated tests.
5. Reviewing findings and recommended improvements.
6. Documenting actual development evidence.

Development screenshots, session recordings, and test logs can be maintained in a dedicated `docs/` evidence directory.

**AdaL acknowledgment:** https://adal.sylph.ai/

---

##  Project Objectives

Robot Browser AI aims to demonstrate how AI-native browsing can improve productivity while maintaining user oversight.

The project focuses on:

- Reducing repetitive browser tasks.
- Making autonomous actions observable.
- Combining multiple AI tools in one workspace.
- Turning web research into usable deliverables.
- Helping users investigate document and data inconsistencies.
- Improving trust through verification and transparency.

---

## 👨‍💻 Developer

**Rohan Bhowmik**

B.Tech — Computer Science & Engineering

Interested in Artificial Intelligence, Machine Learning, Data Science, Generative AI, and Web Devloper.

[![GitHub](https://img.shields.io/badge/GitHub-rohanbhowm25308-181717?style=flat-square&logo=github)](https://github.com/rohanbhowm25308)

---

## ⭐ Support the Project

If you find Robot Browser AI interesting or useful:

-  Star the repository.
-  Fork the project.
-  Report issues.
-  Share ideas for improvements.

Your feedback helps make AI-powered browsing more reliable, transparent, and useful.

---

<div align="center">

### 🤖 Robot Browser AI

**From Browsing to Autonomous Action.**

*Think. Plan. Execute. Verify.*

**Made with ❤️, Python, AI Agents, and AdaL-assisted development.**
