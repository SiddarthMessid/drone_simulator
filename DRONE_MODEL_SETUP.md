# 🚁 Drone GLTF Model Integration Guide

This guide will help you replace the procedural drone model with your custom GLTF model.

## 📁 Step 1: Add Your Model Files

Place your GLTF model files in the following location:

```
client/public/models/drone/
├── scene.gltf
├── scene.bin
└── textures/
    ├── texture1.png
    ├── texture2.png
    └── ...
```

**Important:** Make sure the folder structure is:

- `client/public/models/drone/scene.gltf` (main GLTF file)
- `client/public/models/drone/scene.bin` (binary data)
- `client/public/models/drone/textures/` (all texture files)

## ⚙️ Step 2: Configure the Model

Open `client/src/lib/droneModelConfig.ts` and change:

```typescript
export const droneModelConfig: DroneModelConfig = {
  type: "gltf", // ← Change from 'procedural' to 'gltf'

  gltfPath: "/models/drone/scene.gltf",
  scale: 1.0, // Adjust if your model is too big/small
  propellerAxis: "y", // Change to 'x' or 'z' if propellers don't spin correctly
};
```

## 🔧 Step 3: Test the Model

1. Save the files
2. The dev server should auto-reload
3. You should see your GLTF model instead of the procedural one

## 🎯 Propeller Animation

The system will automatically detect propellers by searching for meshes with these names:

- "propeller"
- "rotor"
- "blade"
- "prop"
- "fan"

### If Auto-Detection Doesn't Work:

1. Open your GLTF file in a text editor or Blender
2. Find the exact names of your propeller meshes
3. Update the config:

```typescript
export const droneModelConfig: DroneModelConfig = {
  type: "gltf",
  gltfPath: "/models/drone/scene.gltf",
  scale: 1.0,
  propellerAxis: "y",

  // Add specific propeller names
  propellerNames: [
    "Propeller_FL",
    "Propeller_FR",
    "Propeller_BL",
    "Propeller_BR",
  ],
};
```

4. Update `DroneModelGLTF.tsx` to use these names (see code comments)

## 📏 Adjusting Model Scale

If your drone appears too large or too small:

```typescript
scale: 0.5,  // Makes model 50% smaller
scale: 2.0,  // Makes model 2x larger
```

## 🔄 Switching Back to Procedural Model

To use the original procedural model:

```typescript
export const droneModelConfig: DroneModelConfig = {
  type: "procedural", // ← Change back to 'procedural'
};
```

## 🐛 Troubleshooting

### Model doesn't appear:

- Check browser console for errors
- Verify file paths are correct
- Make sure files are in `client/public/models/drone/`

### Propellers don't spin:

- Check console for "Found propeller:" messages
- Try different `propellerAxis` values ('x', 'y', or 'z')
- Manually specify propeller names in config

### Model is wrong size:

- Adjust the `scale` parameter
- Typical values: 0.1 to 10.0

### Textures missing:

- Ensure texture paths in scene.gltf are relative
- Check that textures folder is in the same directory

## 🎨 Collision Box

The collision box remains the same regardless of model:

- Size: 2.0 × 1.0 × 2.0 units
- Centered on the drone

To visualize the collision box for debugging:

In `DroneModelSwitcher.tsx`:

```typescript
<DroneModelSwitcher showCollisionBox={true} />
```

## 📝 Model Requirements

Your GLTF model should:

- ✅ Be in GLTF format (not GLB - or convert GLB to GLTF)
- ✅ Have propeller meshes with recognizable names
- ✅ Be reasonably sized (1-5 units in Blender)
- ✅ Have proper materials and textures
- ✅ Be optimized (not too many polygons)

## 🚀 Advanced: Custom Propeller Logic

If you need custom propeller animation logic, edit:
`client/src/components/DroneModelGLTF.tsx`

Look for the `useFrame` hook where propeller rotation is handled.

## ✅ What Still Works

All simulation features work with GLTF models:

- ✅ Physics and collision detection
- ✅ PID control and stabilization
- ✅ Keyboard/gamepad controls
- ✅ Autopilot commands
- ✅ Wind effects
- ✅ Telemetry data
- ✅ Camera modes (follow, FPV, free)
- ✅ Mission planning
- ✅ Multi-drone support

The GLTF model is purely visual - all physics calculations remain the same!

---

## 📦 Example Folder Structure

```
client/
└── public/
    └── models/
        └── drone/
            ├── scene.gltf      ← Main model file
            ├── scene.bin       ← Binary data
            └── textures/       ← Texture folder
                ├── Material_baseColor.png
                ├── Material_normal.png
                └── Material_metallicRoughness.png
```

## 🎯 Quick Start Checklist

- [ ] Copy model files to `client/public/models/drone/`
- [ ] Open `client/src/lib/droneModelConfig.ts`
- [ ] Change `type: 'procedural'` to `type: 'gltf'`
- [ ] Adjust `scale` if needed
- [ ] Save and test
- [ ] Check console for propeller detection
- [ ] Adjust `propellerAxis` if needed

---

**Need help?** Check the browser console for error messages and propeller detection logs!
