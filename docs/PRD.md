# Workout Planner & Tracker Pro — PRD

## App Description
A web-based application that lets users create workout plans, define exercises per plan, and log gym sessions. The app tracks progress over time and calculates training volume automatically.

## How it builds on course skills
- HTML forms + UI structure
- CSS layout and styling
- JavaScript DOM manipulation & event handling
- Data persistence using LocalStorage
- Application architecture (state, rendering, utilities)
- External library integration (Chart.js)
- GitHub workflow: PRD + README + structured repo

## Key Features
### Plans & Exercises
- Create / rename / delete workout plans
- Add exercises to a specific plan
- Rename / delete exercises inside a plan
- Expand/collapse plan cards for clean UI

### Logging & Tracking
- Add workout log (plan + exercise + weight + reps)
- Automatic volume calculation (weight × reps)
- Delete single log, clear all logs

### Insights
- Stats panel: total logs, total volume, unique exercises, last workout
- Filters: by plan, by exercise, and text search
- Progress chart per exercise (weight or volume)

### Smart Feature
- Simple progressive overload suggestion based on recent performance

### Data Tools
- Export JSON / Import JSON (backup, sharing)
- Reset all data (plans + exercises + logs)

## Resources
- VS Code (optional, can edit via GitHub)
- Browser
- GitHub repository
- Chart.js CDN

## Workflow
1. Create PRD + README
2. Create repo structure (docs/src)
3. Build UI in HTML/CSS
4. Implement state + LocalStorage (plans/logs)
5. Implement CRUD (plans/exercises/logs)
6. Add insights (stats, filters)
7. Integrate Chart.js for progress chart
8. Add export/import + reset tools
9. Manual testing and refinement
10. Submit GitHub repo link (and optionally GitHub Pages)
