# devLog

A cinematic timeline-based platform where people document projects, thoughts, experiments, and progress over time.

---

# Vision

devLog is not a productivity tool.

It is:
- a creation journal
- a project timeline
- a digital archive of progress
- a storytelling platform for makers

Users should feel:
- reflective
- inspired
- emotionally connected to their work

The platform should feel calm, aesthetic, and human.

---

# Core Idea

Users create projects.

Inside projects they can:
- add timeline logs
- upload images/videos
- track milestones
- share progress
- collaborate with others

Each project becomes a living timeline.

---

# Design Philosophy

DO:
- cinematic UI
- smooth animations
- minimal layouts
- elegant typography
- immersive timelines
- emotional storytelling

DO NOT:
- corporate dashboard feel
- cluttered productivity UI
- excessive metrics
- noisy social media mechanics

---

# Tech Stack

## Frontend
- React
- Vite
- TypeScript
- TailwindCSS
- Framer Motion
- Zustand
- React Router

## Backend
- Supabase

## Hosting
- Vercel or Cloudflare Pages

---

# Architecture

Frontend:
- feature-based architecture
- reusable component system
- centralized state management

Backend:
- Supabase Auth
- PostgreSQL
- Storage
- Realtime
- Row Level Security

---

# Main Features

## Authentication
- signup/login
- session persistence
- protected routes

## User Profiles
- avatar
- bio
- social links

## Projects
- create/edit/delete
- visibility controls
- collaborators

## Timeline Logs
- markdown editor
- media uploads
- timestamps
- mood/status

## Visibility System
- public
- private
- shared
- unlisted

## Public Pages
- shareable projects
- creator portfolios

## Social Features
- comments
- reactions
- follows

---

# Visibility Rules

Projects and logs support:

| Mode | Access |
|---|---|
| Private | Only owner |
| Shared | Selected users |
| Public | Everyone |
| Unlisted | Link only |

---

# Database Models

## profiles
- id
- username
- bio
- avatar_url

## projects
- id
- owner_id
- title
- description
- visibility

## logs
- id
- project_id
- title
- content
- created_at
- visibility

## collaborators
- id
- project_id
- user_id
- role

## comments
- id
- log_id
- user_id
- content

---

# Folder Structure

src/
  components/
  features/
  hooks/
  lib/
  pages/
  services/
  stores/
  styles/
  types/
  utils/

---

# MVP Scope

Version 1 includes:
- authentication
- projects
- timeline logs
- media upload
- visibility system
- public project pages

Nothing more.

---

# Future Features

- AI summaries
- activity heatmaps
- journey playback
- project analytics
- realtime collaboration

---

# UI Inspiration

Inspired by:
- Linear
- Notion
- GitHub activity graphs
- cinematic storytelling websites

---

# Success Criteria

A user should:
- enjoy documenting progress
- feel emotionally connected to their timeline
- want to revisit old projects
- proudly share projects publicly

---

# Product Identity

devLog is:
- reflective
- aesthetic
- creator-first
- timeline-centric
- emotionally engaging

Not:
- a task manager
- a corporate dashboard
- another productivity SaaS
