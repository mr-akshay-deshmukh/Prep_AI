# 📝 Changelog

All notable changes to **PrepAI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-04

### Added
- **Daily Streak Tracker & Gamification**:
  - Interactive daily streak tracker component with consecutive day counter.
  - Daily prep task checklist (Mock interview, Flashcard drill, Resume check, Story Vault).
  - Streak freeze grace feature to preserve user momentum.
- **Streak Achievement Badges & Rewards System**:
  - **7-Day Streak Badge ("Week Warrior")**: Bronze Placement Shield + 250 XP boost + STAR Method Cheat Sheet.
  - **30-Day Streak Badge ("Placement Master")**: Gold Master Crown + 1,200 XP boost + Priority Gemini Coach mode.
  - **100-Day Streak Badge ("Diamond Centurion")**: Diamond Centurion Trophy + 5,000 XP boost + Senior Staff Simulation.
  - Dedicated `StreakAchievementBadges` dashboard widget with 3D cards, live progress meters, and detailed inspection modal.
- **AI Mock Interview Simulator**:
  - Web Speech API integration for natural voice response transcription.
  - 4 distinct interviewer personas (Alex Rivers, Sarah Jenkins, Marcus Vance, Dr. Elena Rostova).
  - Multi-dimensional feedback generation: STAR method compliance, filler word counter, clarity scoring, and actionable coaching tips.
- **ATS Resume Analyzer & Interactive Builder**:
  - Automated PDF/Image resume analysis with ATS compatibility scores.
  - Role-fit recommendations based on candidate work history.
  - Live WYSIWYG ATS Resume Builder with spellcheck integration and 1-click PDF download (`pdfmake`).
- **AI Project Blueprint Generator**:
  - Generates bespoke full-stack and distributed systems project roadmaps.
  - Automatic Mermaid flowchart rendering for architecture design.
- **Career Preparation Suite**:
  - **Story Vault**: STAR framework story organizer for behavioral interview answers.
  - **Flashcards Deck**: Interactive CS, algorithms, and system design drills.
  - **Job Application Tracker**: Pipeline management for tracking job applications.
  - **Skill Gap Analyzer**: Benchmark skills against target job descriptions.
  - **Gemini Chat**: Conversational AI assistant for continuous career coaching.
- **Security & Reliability**:
  - Server-side Express proxy for `@google/genai` calls with sanitized error formatting.
  - Client-side fallback API key management via `ApiSettingsModal`.
  - Firebase Firestore security rules ensuring user UID isolation.

---

## [0.9.0] - 2026-09-15

### Added
- Initial project prototype with core interview questions and basic chat.
- Firebase Authentication and Firestore real-time sync.
- Tailwind CSS v4 styling setup and responsive dashboard layouts.
