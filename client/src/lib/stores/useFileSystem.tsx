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

export const useFileSystem = create<FileSystemState>()(
  persist(
    (set, get) => ({
      files: [],
      folders: [],
      currentFileId: null,

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
    }
  )
);
