# Interactive Environment Editor Guide

## Overview

The new environment editor provides CoppeliaSim-style 3D manipulation tools for placing and transforming obstacles in your drone simulation.

## Features

### 🎮 Transform Controls

#### Translation Mode

- Click **📍 Translate** to enable translation mode
- Select axes to constrain movement:
  - **Single axis (X, Y, or Z)**: Object moves along one axis only
  - **Two axes**: Object moves on a plane (e.g., X+Z for ground plane)
- Drag the colored arrows in the 3D scene to move the object

#### Rotation Mode

- Click **🔄 Rotate** to enable rotation mode
- Select **ONE axis at a time** (X, Y, or Z)
- Drag the colored ring in the 3D scene to rotate around that axis

### 📦 Object Management

#### Adding Obstacles

1. Open the Environment Editor panel
2. In the "Add New Obstacle" section:
   - Set name and color
   - Define size (Width × Height × Depth)
   - Set X and Z position (Y is auto-calculated to place on ground)
3. Click **➕ Add to Scene**
4. The obstacle spawns on the ground with a visible wireframe

#### Selecting Objects

- **Click any obstacle** in the 3D scene to select it
- Selected objects show a **yellow wireframe**
- Hover over objects to see a white highlight

#### Editing Selected Object

- Position and rotation values shown in the editor panel
- Manually adjust values using input fields
- Or use transform gizmos for visual manipulation

#### Deleting Objects

- Select the object
- Click **🗑️ Delete Obstacle** in the editor panel

### 🎨 Visual Feedback

- **Red Arrow/Ring**: X-axis manipulation
- **Green Arrow/Ring**: Y-axis manipulation
- **Blue Arrow/Ring**: Z-axis manipulation
- **Yellow Highlight**: Active axis being dragged
- **Yellow Wireframe**: Selected object
- **White Wireframe**: Hovered object

### ⌨️ Axis Selection Rules

**Translation Mode:**

- Can select up to 2 axes simultaneously
- 1 axis = constrained line movement
- 2 axes = constrained plane movement

**Rotation Mode:**

- Can only select 1 axis at a time
- Prevents gimbal lock and confusion
- Clear single-axis rotation

## Workflow Example

1. **Add an obstacle**: Set size to 3×5×3, position at X=10, Z=10
2. **Select it**: Click the obstacle in the scene (yellow wireframe appears)
3. **Enable translation**: Click "📍 Translate" button
4. **Select Y axis**: Click the green "Y" button
5. **Drag up**: Click and drag the green arrow to adjust height
6. **Switch to rotation**: Click "🔄 Rotate" button
7. **Select Y axis**: Click the green "Y" button
8. **Rotate**: Drag the green ring to rotate around vertical axis
9. **Fine-tune**: Use the input fields for precise values
10. **Done**: Click elsewhere to deselect

## Tips

- Objects spawn on the ground automatically (Y = height/2)
- Use X+Z translation for easy ground-plane positioning
- Use Y translation to adjust height
- Rotation values shown in degrees for easier understanding
- All changes are real-time and immediately affect collision detection
- Click empty space to deselect and hide gizmos

## Keyboard Shortcuts (Future Enhancement)

- `T` - Toggle translate mode
- `R` - Toggle rotate mode
- `X/Y/Z` - Select axis
- `Delete` - Remove selected object
- `Escape` - Deselect

Enjoy building your drone obstacle courses! 🚁
