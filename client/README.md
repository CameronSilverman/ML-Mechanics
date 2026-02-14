# ML Maker Studio — Frontend

Visual drag-and-drop workspace for building ML pipelines.

## Setup

```bash
cd client
npm install
npm start
```

Opens at `http://localhost:3000`. Navigate to `/whiteboard` or click **Open Workspace** from the home page.

## Structure

```
src/
  data/mlComponents.js     — Component definitions (types, defaults, colors)
  components/
    Sidebar.js             — Draggable component library, organized by category
    Canvas.js              — Drop target workspace, manages block state
    CanvasBlock.js          — Individual block on the canvas
    ContextMenu.js          — Right-click menu (edit/delete)
    PropertiesPanel.js      — Modal for editing block properties
  pages/
    WhiteboardPage.js       — Composes Sidebar + Canvas with DndProvider
  styles/
    index.css               — All styles
  App.js                    — Router (Home → Whiteboard)
  index.js                  — Entry point
```

## Usage

- **Add blocks**: Drag from sidebar → drop on canvas
- **Move blocks**: Drag blocks around the canvas
- **Edit properties**: Right-click a block → Edit Properties
- **Delete blocks**: Right-click a block → Delete

## Dependencies

- `react-dnd` + `react-dnd-html5-backend` — Drag and drop
- `react-router-dom` — Routing
