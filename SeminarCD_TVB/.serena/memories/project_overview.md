# Project Overview: DACN_TourGuideWeb — Travel TVB

## Purpose
A full-stack tour guide and booking web application for **Travel TVB**, a Vietnamese travel agency.

## Key Features
- Tour browsing, filtering, and booking
- VNPay payment integration (Vietnamese payment gateway)
- AI-powered chatbot using RAG (ChromaDB + Google Gemini)
- Multi-language support: Vietnamese (vi), English (en), Chinese (zh)
- CMS-managed content via Strapi admin panel
- Blog/news and community posts

## Architecture
- **Frontend** (port 5173): React 19 + Vite
- **Backend** (port 1337): Strapi 5 Headless CMS
- **Database**: SQLite (default, file: `.tmp/data.db`)
- **Vector DB** (port 8000): ChromaDB for chatbot RAG
- **AI**: Google Gemini 2.5 Flash (LLM) + Gemini Embedding 001
- **Payments**: VNPay Sandbox

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19.1.0, Vite 7.0.4, React Router 7.8.0, Framer Motion, React Icons |
| Backend | Strapi 5.36.0, better-sqlite3 |
| AI/Chatbot | Google Gemini 2.5 Flash, ChromaDB 3.4.0 |
| Payments | VNPay Sandbox |
| Testing | Vitest 4.1.2 (frontend), Jest 30.3.0 (backend), React Testing Library 16.3.2 |
| CI/CD | GitHub Actions |

## University Context
Developed as a university capstone project (DACN - Do An Chuyen Nganh).
