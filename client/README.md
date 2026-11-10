# JoblessDesk — Frontend

A complete, fully functional React + Vite frontend application for the JoblessDesk career intelligence platform.

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Framework   | React 18 + Vite         |
| Routing     | React Router v6         |
| Styling     | Tailwind CSS v3         |
| Charts      | Recharts                |
| State       | Zustand                 |
| Icons       | Lucide React            |
| Toasts      | react-hot-toast         |

## Project Structure

```
src/
├── api/
│   ├── client.js          # Base HTTP client (JWT injection)
│   └── index.js           # All API modules (authApi, jobCardsApi, salaryApi, ...)
├── components/
│   ├── cards/
│   │   └── index.jsx      # JobCard, MentorCard, RoadmapCard, ProfileCard
│   ├── layout/
│   │   ├── Navbar.jsx     # Sticky navbar with mobile menu + user dropdown
│   │   └── Footer.jsx     # Newsletter + links
│   └── ui/
│       └── index.jsx      # Spinner, EmptyState, Pagination, Modal, StarRating, ...
├── hooks/
│   └── useFetch.js        # useFetch + useDebounce
├── pages/
│   ├── Home.jsx           # Hero + trending + how it works + stories
│   ├── Roadmaps.jsx       # Browse with sidebar filters
│   ├── RoadmapDetail.jsx  # Accordion steps + progress tracking
│   ├── CareerRoadmap.jsx  # 8-tab career detail page
│   ├── Categories.jsx     # Career categories sidebar
│   ├── SalaryAnalytics.jsx# Recharts bar + line + salary table
│   ├── Compare.jsx        # Side-by-side job comparison
│   ├── FindMentor.jsx     # Mentor grid + filters
│   ├── MentorProfile.jsx  # Mentor detail + book session modal
│   ├── AddJourney.jsx     # 4-step multi-step form
│   ├── AiBeta.jsx         # AI search interface
│   ├── Dashboard.jsx      # 5-tab user dashboard
│   ├── Login.jsx          # Sign-in form
│   ├── Register.jsx       # Registration form
│   ├── Profile.jsx        # User profile viewer
│   └── NotFound.jsx       # 404 page
├── store/
│   └── authStore.js       # Zustand auth state (login/register/logout/init)
└── styles/
    └── globals.css        # Tailwind + design tokens + component classes
```

## Pages → API Mapping

| Page             | APIs Connected                                                   |
|------------------|------------------------------------------------------------------|
| Home             | `feedApi.trending`, `roadmapsApi.list`                          |
| Roadmaps         | `jobCardsApi.list`, `roadmapsApi.list`                          |
| Career Roadmap   | `jobCardsApi.get/section`, `trajectoryApi`, `salaryApi`, `roadmapsApi` |
| Salary Analytics | `salaryApi.index/percentiles/trend/compare/submit`              |
| Compare          | `jobCardsApi.list`, `salaryApi.compare`                         |
| Find Mentor      | `mentorsApi.list`, `jobCardsApi.list`                           |
| Mentor Profile   | `mentorsApi.get/book`                                           |
| Add Journey      | Auth check + form submission                                     |
| AI Guide         | `searchApi.jobCards`                                            |
| Dashboard        | `usersApi`, `mentorsApi.mySessions`, `feedApi`, `roadmapsApi`  |
| Login/Register   | `authApi.login/register`                                        |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment (if needed)
cp .env.example .env

# Start dev server (proxies /api to localhost:4000)
npm run dev
```

App runs on **http://localhost:3000**

Backend must be running on **http://localhost:4000**

## Demo Credentials

```
Email:    test@example.com
Password: TestPass1!
```

Or use mentor accounts:
```
ravi@example.com / Password1!
priya@example.com / Password1!
```

## Design System

Dark theme with consistent color tokens:

| Token         | Value     | Usage               |
|---------------|-----------|---------------------|
| bg-primary    | #0b0e18   | Page background     |
| bg-secondary  | #111520   | Section backgrounds |
| bg-card       | #161d2e   | Card backgrounds    |
| bg-border     | #1e2a3d   | Borders             |
| accent        | #4f7dff   | Primary actions     |
| brand-green   | #22c55e   | Success / growing   |
| brand-amber   | #f59e0b   | Warnings / AI badge |
| brand-purple  | #8b5cf6   | Secondary accent    |

## Component Classes

```css
.card          /* bg-card + border */
.card-hover    /* card + hover effects */
.btn-primary   /* accent bg button */
.btn-secondary /* muted button */
.btn-ghost     /* transparent button */
.btn-outline   /* border button */
.input         /* form input */
.select        /* form select */
.label         /* form label */
.badge-blue / .badge-green / .badge-amber / .badge-red / .badge-purple / .badge-gray
.gradient-text /* accent → purple gradient */
.skeleton      /* loading placeholder */
```
