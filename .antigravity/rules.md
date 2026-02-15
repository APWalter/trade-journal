# Agent Guardrails: Trade Journal Pro

## Core Principles
- **Math Integrity:** Never refactor `calculations/` or `formulas/` without a Peer Review Artifact. 
- **Data Privacy:** Do not hardcode any trade data; always use the environment variables or the mock-data layer.
- **Tech Stack:** Stick to Next.js, Tailwind, and Shadcn UI. 

## Workflow Rules
1. Before writing code for a new feature, generate an **Implementation Plan** artifact.
2. If a UI change is made, use the **Browser Tool** to verify the layout before finishing.
3. Use **Gemini 3 Pro** for complex reasoning tasks.