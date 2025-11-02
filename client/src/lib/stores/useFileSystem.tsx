import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DroneFile {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  folder?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
}

interface FileSystemState {
  files: DroneFile[];
  folders: Folder[];
  currentFileId: string | null;

  // File operations
  createFile: (name: string, folder?: string) => string;
  deleteFile: (id: string) => void;
  updateFile: (id: string, content: string) => void;
  renameFile: (id: string, newName: string) => void;
  setCurrentFile: (id: string | null) => void;
  getCurrentFile: () => DroneFile | null;

  // Folder operations
  createFolder: (name: string, parentId?: string) => string;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, newName: string) => void;

  // Utility
  getFilesInFolder: (folderId?: string) => DroneFile[];
  getFoldersByParent: (parentId?: string) => Folder[];
}

const DEFAULT_EXAMPLE_FILE: DroneFile = {
  id: "example_default",
  name: "example.js",
  content: `// ============================================
// DRONE API EXAMPLES
// ============================================
// Welcome! This file contains examples of how to control the drone.
// Click the "Run" button to execute the code.

// ============================================
// EXAMPLE 1: Simple Takeoff and Land
// ============================================
async function simpleMission() {
  console.log("Starting simple mission...");
  
  // Take off to 10 meters
  await drone.takeoff(10);
  console.log("Takeoff complete!");
  
  // Hover for 3 seconds
  await drone.delay(3);
  console.log("Hovering...");
  
  // Land
  await drone.land();
  console.log("Landing complete!");
}

// Run the mission
simpleMission();


// ============================================
// EXAMPLE 2: Fly to Position
// ============================================
/*
async function flyToPosition() {
  await drone.takeoff(15);
  
  // Fly to position (x: 20, y: 15, z: 30)
  const targetPos = drone.createPosition(20, 15, 30);
  await drone.moveTo(targetPos);
  console.log("Reached target!");
  
  await drone.land();
}

// Uncomment to run:
// flyToPosition();
*/


// ============================================
// EXAMPLE 3: Swarm Control
// ============================================
/*
async function testSwarm() {
  // Enable swarm mode
  drone.swarm.enable();
  
  // Add 4 drones
  for (let i = 0; i < 4; i++) {
    drone.swarm.addDrone();
  }
  
  // Set circle formation
  drone.swarm.form('circle');
  await drone.delay(3);
  
  // Change to line formation
  drone.swarm.form('line');
  await drone.delay(3);
  
  // Emergency land all
  await drone.swarm.emergencyLandAll();
  
  drone.swarm.disable();
}

// Uncomment to run:
// testSwarm();
*/


// ============================================
// AVAILABLE API METHODS:
// ============================================
/*
BASIC FLIGHT:
- drone.takeoff(altitude)
- drone.land()
- drone.hover()
- drone.brake()
- drone.moveTo(position)
- drone.setPitch(degrees)
- drone.setRoll(degrees)
- drone.setYaw(degrees)

TELEMETRY:
- drone.getPosition()
- drone.getRotation()
- drone.getVelocity()
- drone.getTelemetry()

SWARM:
- drone.swarm.enable()
- drone.swarm.addDrone()
- drone.swarm.form('circle'|'line'|'V')
- drone.swarm.behavior('follow'|'scatter'|'gather')
- drone.swarm.count()

UTILITIES:
- drone.delay(seconds)
- drone.createPosition(x, y, z)
- drone.isFlying()
- drone.isStable()

See DRONE_API_SAMPLE.js for more examples!
*/
`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useFileSystem = create<FileSystemState>()(
  persist(
    (set, get) => ({
      files: [DEFAULT_EXAMPLE_FILE],
      folders: [],
      currentFileId: DEFAULT_EXAMPLE_FILE.id,

      createFile: (name: string, folder?: string) => {
        const id = `file_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newFile: DroneFile = {
          id,
          name,
          content: "// New drone program\n",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          folder,
        };
        set((state) => ({ files: [...state.files, newFile] }));
        return id;
      },

      deleteFile: (id: string) => {
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
          currentFileId:
            state.currentFileId === id ? null : state.currentFileId,
        }));
      },

      updateFile: (id: string, content: string) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, content, updatedAt: Date.now() } : f
          ),
        }));
      },

      renameFile: (id: string, newName: string) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: newName, updatedAt: Date.now() } : f
          ),
        }));
      },

      setCurrentFile: (id: string | null) => {
        set({ currentFileId: id });
      },

      getCurrentFile: () => {
        const state = get();
        return state.files.find((f) => f.id === state.currentFileId) || null;
      },

      createFolder: (name: string, parentId?: string) => {
        const id = `folder_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newFolder: Folder = { id, name, parentId };
        set((state) => ({ folders: [...state.folders, newFolder] }));
        return id;
      },

      deleteFolder: (id: string) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          files: state.files.filter((f) => f.folder !== id),
        }));
      },

      renameFolder: (id: string, newName: string) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name: newName } : f
          ),
        }));
      },

      getFilesInFolder: (folderId?: string) => {
        const state = get();
        return state.files.filter((f) => f.folder === folderId);
      },

      getFoldersByParent: (parentId?: string) => {
        const state = get();
        return state.folders.filter((f) => f.parentId === parentId);
      },
    }),
    {
      name: "drone-file-system",
      version: 1, // Increment version to force re-initialization
    }
  )
);
