import { useState } from "react";
import { useFileSystem } from "../lib/stores/useFileSystem";
import {
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
} from "lucide-react";

export default function FileExplorer() {
  const {
    files,
    folders,
    currentFileId,
    createFile,
    deleteFile,
    renameFile,
    setCurrentFile,
    createFolder,
    deleteFolder,
    renameFolder,
    getFilesInFolder,
    getFoldersByParent,
  } = useFileSystem();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["root"])
  );
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "file" | "folder";
    id: string;
  } | null>(null);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      const id = createFile(newFileName.trim());
      setCurrentFile(id);
      setNewFileName("");
      setShowNewFileInput(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  const handleRename = () => {
    if (editingId && editingName.trim()) {
      const isFolder = folders.some((f) => f.id === editingId);
      if (isFolder) {
        renameFolder(editingId, editingName.trim());
      } else {
        renameFile(editingId, editingName.trim());
      }
      setEditingId(null);
      setEditingName("");
    }
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
    setContextMenu(null);
  };

  const handleDelete = (id: string, type: "file" | "folder") => {
    if (confirm(`Delete this ${type}?`)) {
      if (type === "folder") {
        deleteFolder(id);
      } else {
        deleteFile(id);
      }
    }
    setContextMenu(null);
  };

  const renderFile = (file: any, depth: number = 0) => {
    const isSelected = currentFileId === file.id;
    const isEditing = editingId === file.id;

    return (
      <div
        key={file.id}
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          background: isSelected ? "rgba(59, 130, 246, 0.2)" : "transparent",
          borderLeft: isSelected
            ? "3px solid #3b82f6"
            : "3px solid transparent",
        }}
        onClick={() => !isEditing && setCurrentFile(file.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: "file",
            id: file.id,
          });
        }}
      >
        <File size={14} color="#3b82f6" />
        {isEditing ? (
          <input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setEditingId(null);
            }}
            onBlur={handleRename}
            autoFocus
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid #3b82f6",
              borderRadius: "3px",
              padding: "2px 4px",
              color: "#e5e5e5",
              fontSize: "12px",
            }}
          />
        ) : (
          <span style={{ fontSize: "12px", flex: 1 }}>{file.name}</span>
        )}
      </div>
    );
  };

  const renderFolder = (folder: any, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isEditing = editingId === folder.id;
    const filesInFolder = getFilesInFolder(folder.id);
    const subFolders = getFoldersByParent(folder.id);

    return (
      <div key={folder.id}>
        <div
          style={{
            paddingLeft: `${depth * 16 + 8}px`,
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
          }}
          onClick={() => !isEditing && toggleFolder(folder.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              type: "folder",
              id: folder.id,
            });
          }}
        >
          {isExpanded ? (
            <FolderOpen size={14} color="#f59e0b" />
          ) : (
            <Folder size={14} color="#f59e0b" />
          )}
          {isEditing ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setEditingId(null);
              }}
              onBlur={handleRename}
              autoFocus
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #3b82f6",
                borderRadius: "3px",
                padding: "2px 4px",
                color: "#e5e5e5",
                fontSize: "12px",
              }}
            />
          ) : (
            <span style={{ fontSize: "12px", fontWeight: "600" }}>
              {folder.name}
            </span>
          )}
        </div>
        {isExpanded && (
          <div>
            {subFolders.map((sf) => renderFolder(sf, depth + 1))}
            {filesInFolder.map((f) => renderFile(f, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootFiles = getFilesInFolder(undefined);
  const rootFolders = getFoldersByParent(undefined);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(10, 10, 10, 0.95)",
        color: "#e5e5e5",
      }}
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "600" }}>Files</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowNewFileInput(true)}
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: "4px",
              padding: "4px 8px",
              color: "#3b82f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
            }}
            title="New File"
          >
            <File size={12} />
            New
          </button>
          <button
            onClick={() => setShowNewFolderInput(true)}
            style={{
              background: "rgba(245, 158, 11, 0.2)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              borderRadius: "4px",
              padding: "4px 8px",
              color: "#f59e0b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
            }}
            title="New Folder"
          >
            <Folder size={12} />
            New
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* New File Input */}
        {showNewFileInput && (
          <div
            style={{
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <File size={14} color="#3b82f6" />
            <input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile();
                if (e.key === "Escape") setShowNewFileInput(false);
              }}
              placeholder="filename.js"
              autoFocus
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #3b82f6",
                borderRadius: "3px",
                padding: "4px 6px",
                color: "#e5e5e5",
                fontSize: "12px",
              }}
            />
            <button
              onClick={handleCreateFile}
              style={{
                background: "transparent",
                border: "none",
                color: "#10b981",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <Save size={14} />
            </button>
            <button
              onClick={() => setShowNewFileInput(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* New Folder Input */}
        {showNewFolderInput && (
          <div
            style={{
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Folder size={14} color="#f59e0b" />
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setShowNewFolderInput(false);
              }}
              placeholder="folder name"
              autoFocus
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #f59e0b",
                borderRadius: "3px",
                padding: "4px 6px",
                color: "#e5e5e5",
                fontSize: "12px",
              }}
            />
            <button
              onClick={handleCreateFolder}
              style={{
                background: "transparent",
                border: "none",
                color: "#10b981",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <Save size={14} />
            </button>
            <button
              onClick={() => setShowNewFolderInput(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Folders */}
        {rootFolders.map((folder) => renderFolder(folder))}

        {/* Root Files */}
        {rootFiles.map((file) => renderFile(file))}

        {files.length === 0 && folders.length === 0 && (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#666",
              fontSize: "12px",
            }}
          >
            No files yet. Create one to get started!
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            background: "rgba(20, 20, 20, 0.98)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "6px",
            padding: "4px",
            zIndex: 10000,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const item =
                contextMenu.type === "file"
                  ? files.find((f) => f.id === contextMenu.id)
                  : folders.find((f) => f.id === contextMenu.id);
              if (item) startRename(contextMenu.id, item.name);
            }}
            style={{
              width: "100%",
              padding: "6px 12px",
              background: "transparent",
              border: "none",
              color: "#e5e5e5",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Edit2 size={12} />
            Rename
          </button>
          <button
            onClick={() => handleDelete(contextMenu.id, contextMenu.type)}
            style={{
              width: "100%",
              padding: "6px 12px",
              background: "transparent",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
