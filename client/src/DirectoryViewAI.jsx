import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaEnvelope,
  FaUserCircle,
  FaUpload,
  FaFolderPlus,
  FaEllipsisV,
  FaFolder,
  FaFile,
  FaEdit,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaTimes,
  FaCloudUploadAlt,
} from "react-icons/fa";

function DirectoryViewAI() {
  const navigate = useNavigate();
  const [directories, setDirectories] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renameText, setRenameText] = useState("");
  const [renameFileId, setRenameFileId] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentDirectoryId, setCurrentDirectoryId] = useState("");
  const [isFolderRenaming, setIsFolderRenaming] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userData, setUserData] = useState({
    name: "User",
    email: "user@example.com",
  });
  const url = "http://localhost:5000";
  const { "*": dirPath } = useParams();

  // Create a ref to store the current directory ID
  const currentDirectoryIdRef = useRef("");
  const menuRef = useRef(null);

  // File upload via icon
  const fileInputRef = useRef(null);
  const renameInputRef = useRef(null);

  const [activeItemMenu, setActiveItemMenu] = useState(null);

  // Handle outside click to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle outside click to close item menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeItemMenu && !event.target.closest(".item-actions")) {
        setActiveItemMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeItemMenu]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`${url}/user`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await res.json();
      console.log("User data:", data);

      if (data) {
        // Update individual state variables
        setUserName(data.name || "User");
        setUserEmail(data.email || "user@example.com");

        // Also update the userData object for backward compatibility
        setUserData({
          name: data.user.name || "User",
          email: data.user.email || "user@example.com",
        });
      }
    } catch (err) {
      console.log("Error fetching user data:", err);
    }
  }, [url]);

  // Call fetchUserData when component mounts
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Toggle profile menu
  const toggleProfileMenu = useCallback(() => {
    setShowProfileMenu((prev) => !prev);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/user/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.message === "Logged out successfully") {
        navigate("/login");
      }
    } catch (err) {
      console.log(err);
    }
    // Redirect to login page
    navigate("/login");
  }, [navigate]);

  // Fetch folder items
  const getFolderItems = useCallback(async () => {
    try {
      const res = await fetch(
        `${url}/directory${dirPath ? "/" + dirPath : "/"}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.message === "Session expired") {
        navigate("/login");
      }
      if (data.message === "This directory is not accessible") {
        // Show an alert if the directory is not accessible
        alert("This directory is not accessible or does not exist");
        // Navigate back to the root directory
        navigate("/");
        return;
      }
      console.log("data", data);
      setFiles(data.files);
      setDirectories(data.directories);

      // Update both the state and the ref
      setCurrentDirectoryId(data.id);
      currentDirectoryIdRef.current = data.id;

      console.log("Setting currentDirectoryId to:", data.id);
      console.log("currentDirectoryId state:", currentDirectoryId);
      console.log("currentDirectoryId ref:", currentDirectoryIdRef.current);
    } catch (err) {
      alert("Failed to fetch directory contents");
    }
  }, [url, dirPath, navigate]);

  // File upload
  const fileUpload = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Log the values for debugging
      console.log("currentDirectoryId state:", currentDirectoryId);
      console.log("currentDirectoryId ref:", currentDirectoryIdRef.current);
      console.log("dirPath--->", dirPath);
      console.log(dirPath === "");

      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.open("POST", `${url}/file/${file.name}`, true);
      xhr.setRequestHeader(
        "directoryid",
        // Use the ref value which is always up-to-date, or fall back to dirPath
        dirPath ? dirPath : currentDirectoryIdRef.current
      );
      xhr.addEventListener("load", getFolderItems);
      xhr.upload.addEventListener("progress", (e) => {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(progress.toFixed(2));
      });
      xhr.send(file);
    },
    [url, dirPath, getFolderItems]
  );

  // File delete
  const fileDelete = useCallback(
    (id) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.open("DELETE", `${url}/file/${id}`, true);
      xhr.addEventListener("load", getFolderItems);
      xhr.send();
    },
    [url, getFolderItems]
  );

  // Folder delete
  const folderDelete = useCallback(
    (id) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.open("DELETE", `${url}/directory/${id}`, true);
      xhr.addEventListener("load", () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status === 200) {
            getFolderItems();
          } else if (
            response.message &&
            response.message.includes("Non Empty Folder can't be deleted")
          ) {
            alert("Non Empty Folder can't be deleted");
          } else {
            alert(response.message || "Error deleting folder");
          }
        } catch (err) {
          alert("Error deleting folder");
        }
      });
      xhr.addEventListener("error", () => {
        alert("Network error occurred while deleting folder");
      });
      xhr.send();
    },
    [url, getFolderItems]
  );

  // Add folder
  const addFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    // Use the ref value for the current directory ID
    xhr.open("POST", `${url}/directory/${currentDirectoryIdRef.current}`, true);
    xhr.setRequestHeader("directoryname", newFolderName);
    xhr.addEventListener("load", getFolderItems);
    xhr.send();
  }, [url, newFolderName, getFolderItems]);

  // Prepare rename
  const prepareRename = useCallback((id, name, isFolder = false) => {
    setRenameFileId(id);
    setRenameText(name);
    setIsFolderRenaming(isFolder);
    setShowRenameModal(true);

    // Focus the input after modal is shown
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 100);
  }, []);

  // Save rename (file or folder)
  const renameSave = useCallback(() => {
    if (!renameFileId || !renameText.trim()) return;

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    const endpoint = isFolderRenaming
      ? `${url}/directory/${renameFileId}`
      : `${url}/file/${renameFileId}`;

    xhr.open("PATCH", endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.addEventListener("load", () => {
      getFolderItems();
      closeRenameModal();
    });

    const data = isFolderRenaming
      ? { NewDirectoryName: renameText }
      : { newFileName: renameText };

    xhr.send(JSON.stringify(data));
  }, [url, renameFileId, renameText, isFolderRenaming]);

  // Close rename modal
  const closeRenameModal = useCallback(() => {
    setShowRenameModal(false);
    setRenameFileId("");
    setRenameText("");
    setIsFolderRenaming(false);
  }, []);

  // Handle rename key press (Enter to save, Escape to cancel)
  const handleRenameKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        renameSave();
      } else if (e.key === "Escape") {
        closeRenameModal();
      }
    },
    [renameSave, closeRenameModal]
  );

  // File upload via icon
  const triggerFileUpload = useCallback(() => {
    fileInputRef.current.click();
  }, []);

  // Trigger new folder modal
  const handleAddFolder = useCallback(() => {
    setShowAddFolder(true);
  }, []);

  // Toggle item context menu
  const toggleItemMenu = useCallback((itemId) => {
    setActiveItemMenu((prev) => (prev === itemId ? null : itemId));
  }, []);

  useEffect(() => {
    getFolderItems();
  }, [getFolderItems]);

  return (
    <div className="directory-container">
      <div className="header">
        <div className="app-title-container">
          <h1 className="app-title">
            <FaCloudUploadAlt className="app-title-icon" />
            NeoDrive
          </h1>
          <div className="app-subtitle">Cloud Storage Solution</div>
        </div>
        <div className="header-actions">
          <div
            className="folder-icon-container"
            onClick={handleAddFolder}
            title="Create New Folder"
          >
            <FaFolderPlus size={24} />
          </div>
          <div
            className="upload-icon-container"
            onClick={triggerFileUpload}
            title="Upload File"
          >
            <FaUpload size={24} />
            <input
              type="file"
              ref={fileInputRef}
              onChange={fileUpload}
              style={{ display: "none" }}
            />
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress-indicator">
              <div
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className="upload-progress-text">{uploadProgress}%</span>
            </div>
          )}
          <div className="profile-container" ref={menuRef}>
            <div className="profile-icon" onClick={toggleProfileMenu}>
              <FaUserCircle size={32} />
            </div>
            {showProfileMenu && (
              <div className="profile-menu">
                <div className="profile-menu-item">
                  <FaUser className="menu-icon" />
                  <span>{userName || userData.name}</span>
                </div>
                <div className="profile-menu-item">
                  <FaEnvelope className="menu-icon" />
                  <span className="email-text">
                    {userEmail || userData.email}
                  </span>
                </div>
                <div className="profile-menu-divider"></div>
                <div
                  className="profile-menu-item logout"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isFolderRenaming ? "Rename Folder" : "Rename File"}</h3>
              <button className="close-btn" onClick={closeRenameModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label htmlFor="rename-input" className="modal-label">
                Enter a new name for this {isFolderRenaming ? "folder" : "file"}
              </label>
              <input
                id="rename-input"
                ref={renameInputRef}
                className="modal-input"
                type="text"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onKeyDown={handleRenameKeyPress}
                placeholder={isFolderRenaming ? "My Folder" : "document.txt"}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={closeRenameModal}>
                Cancel
              </button>
              <button
                className="modal-save"
                onClick={renameSave}
                disabled={!renameText.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddFolder(false);
                  setNewFolderName("");
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label htmlFor="new-folder-name" className="modal-label">
                Folder name
              </label>
              <input
                id="new-folder-name"
                className="modal-input"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => {
                  setShowAddFolder(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </button>
              <button
                className="modal-save"
                onClick={() => {
                  addFolder();
                  setShowAddFolder(false);
                  setNewFolderName("");
                }}
                disabled={!newFolderName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <ul className="items-list">
        {directories.map(({ id, name }) => (
          <li key={id} className="item">
            <div className="item-info">
              <FaFolder className="item-icon folder-icon" />
              <span className="filename">{name}</span>
            </div>
            <div className="item-actions">
              <div className="menu-trigger" onClick={() => toggleItemMenu(id)}>
                <FaEllipsisV />
              </div>
              {activeItemMenu === id && (
                <div className="item-menu">
                  <Link to={`/${id}`} className="item-menu-option">
                    <FaExternalLinkAlt />
                    <span>Open</span>
                  </Link>
                  <div
                    className="item-menu-option"
                    onClick={() => {
                      prepareRename(id, name, true);
                      toggleItemMenu(null);
                    }}
                  >
                    <FaEdit />
                    <span>Rename</span>
                  </div>
                  <div
                    className="item-menu-option delete"
                    onClick={() => {
                      folderDelete(id);
                      toggleItemMenu(null);
                    }}
                  >
                    <FaTrashAlt />
                    <span>Delete</span>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
        {files.map(({ id, fileName }) => (
          <li key={id} className="item">
            <div className="item-info">
              <FaFile className="item-icon file-icon" />
              <span className="filename">{fileName}</span>
            </div>
            <div className="item-actions">
              <div className="menu-trigger" onClick={() => toggleItemMenu(id)}>
                <FaEllipsisV />
              </div>
              {activeItemMenu === id && (
                <div className="item-menu">
                  <a
                    href={`${url}/file/${id}?action=open`}
                    className="item-menu-option"
                    target="_blank"
                    onClick={() => toggleItemMenu(null)}
                  >
                    <FaExternalLinkAlt />
                    <span>Open</span>
                  </a>
                  <a
                    href={`${url}/file/${id}?action=download`}
                    className="item-menu-option"
                    onClick={() => toggleItemMenu(null)}
                  >
                    <FaUpload className="flip-vertical" />
                    <span>Download</span>
                  </a>
                  <div
                    className="item-menu-option"
                    onClick={() => {
                      prepareRename(id, fileName, false);
                      toggleItemMenu(null);
                    }}
                  >
                    <FaEdit />
                    <span>Rename</span>
                  </div>
                  <div
                    className="item-menu-option delete"
                    onClick={() => {
                      fileDelete(id);
                      toggleItemMenu(null);
                    }}
                  >
                    <FaTrashAlt />
                    <span>Delete</span>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="file-upload-wrapper">
        {/* Keep just the add folder button here */}
      </div>
    </div>
  );
}

export default DirectoryViewAI;
