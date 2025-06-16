import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { Link, useParams, useNavigate } from "react-router-dom";

function DirectoryView() {
  const [directories, setDirectories] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renameText, setRenameText] = useState("");
  const [renameFileId, setRenameFileId] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentDirectoryId, setCurrentDirectoryId] = useState("");
  const [isFolderRenaming, setIsFolderRenaming] = useState(false);
  //const url = "http://[2406:7400:63:cee4:1c4e:9fdc:851:681]:4000";
  const url = "http://192.168.0.103:5000";
  const { "*": dirPath } = useParams();
  const navigate = useNavigate();

  // Helper to build a path
  const buildPath = useCallback(
    (item = "") => (dirPath ? `${dirPath}/${item}` : item),
    [dirPath]
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    // Clear any auth cookies/tokens
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redirect to login page
    navigate("/login");
  }, [navigate]);

  // Fetch folder items
  const getFolderItems = useCallback(async () => {
    console.log("getFolderItems", dirPath);
    // const res = await fetch(
    //   `${url}/directory${currentDirectoryId ? "/" + currentDirectoryId : "/"}`
    // );
    const res = await fetch(`${url}/directory${dirPath ? "/" + dirPath : "/"}`);
    const data = await res.json();
    setFiles(data.files);
    setDirectories(data.directories);
    setCurrentDirectoryId(data.id);
  }, [url, dirPath]);

  // File upload
  const fileUpload = useCallback(
    async (e) => {
      console.log("file upload");
      const file = e.target.files[0];
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${url}/file/${file.name}`, true);
      xhr.setRequestHeader(
        "directoryid",
        dirPath ? dirPath : "a965303d-2899-48f9-902b-bd1992d06778"
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

  // File/folder delete
  const fileDelete = useCallback(
    async (id) => {
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", `${url}/file/${id}`, true);
      xhr.addEventListener("load", getFolderItems);
      xhr.send();
    },
    [url, getFolderItems]
  );

  // File/folder delete
  const folderDelete = useCallback(
    async (id) => {
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", `${url}/directory/${id}`, true);
      xhr.addEventListener("load", () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status === 200) {
            getFolderItems();
          } else {
            // Check for specific error message
            if (
              response.message &&
              response.message.includes("Non Empty Folder can't be deleted")
            ) {
              alert("Non Empty Folder can't be deleted");
            } else {
              alert(response.message || "Error deleting folder");
            }
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
  const addFolder = useCallback(async () => {
    console.log("add folder" + buildPath(newFolderName));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/directory/${currentDirectoryId}`, true);
    xhr.setRequestHeader("directoryname", newFolderName);
    xhr.addEventListener("load", getFolderItems);
    xhr.send();
  }, [url, buildPath, getFolderItems, newFolderName]);

  // Prepare rename
  const fileRename = useCallback(
    (id, fileName) => {
      setRenameFileId(id);
      setRenameText(fileName);
    },
    [buildPath, renameFileId, renameFileId]
  );

  const folderRename = useCallback(
    (id, fileName) => {
      setRenameFileId(id);
      setRenameText(fileName);
      setIsFolderRenaming(true);
    },
    [buildPath, isFolderRenaming]
  );

  // Save rename
  const fileRenameSave = useCallback(
    (rename) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", `${url}/file/${renameFileId}`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("load", () => {
        getFolderItems();
        setRenameText("");
        setRenameFileId("");
      });
      const data = { newFileName: rename };
      xhr.send(JSON.stringify(data));
    },
    [url, getFolderItems, buildPath, renameFileId, renameText]
  );

  const folderRenameSave = useCallback(
    (rename) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", `${url}/directory/${renameFileId}`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("load", () => {
        getFolderItems();
        setRenameText("");
        setRenameFileId("");
      });
      const data = { NewDirectoryName: rename };
      xhr.send(JSON.stringify(data));
    },
    [url, getFolderItems, buildPath, renameFileId, renameText]
  );

  useEffect(() => {
    getFolderItems();
  }, [dirPath]);

  return (
    <div className="directory-container">
      <div
        className="header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 26px",
          marginBottom: "20px",
          width: "100%",
        }}
      >
        <h1>NeoDrive Files</h1>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 16px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
      <div className="file-upload-wrapper">
        <input
          type="file"
          id="file-upload"
          className="file-input"
          onChange={fileUpload}
        />
        <label htmlFor="file-upload" className="file-label">
          Upload File
        </label>
        <span className="upload-progress">{uploadProgress}%</span>
        <input
          type="text"
          className="upload-textbox"
          placeholder="Type here..."
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
        />
        <button
          className="save-btn"
          onClick={
            isFolderRenaming
              ? () => folderRenameSave(renameText)
              : () => fileRenameSave(renameText)
          }
        >
          Save
        </button>
        <button
          className="add-folder-btn"
          onClick={() => setShowAddFolder(true)}
          title="Add Folder"
        >
          <span role="img" aria-label="Add Folder">
            🗂️
          </span>
        </button>
      </div>
      {showAddFolder && (
        <div className="modal-overlay">
          <div className="modal">
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
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <ul>
        {directories.map(({ id, name }) => (
          <li key={name}>
            <span className="filename">📁 {name}</span>
            <a href={`/${id}`} className="open-link" rel="noopener noreferrer">
              Open
            </a>
            <button
              className="rename-btn"
              onClick={() => folderRename(id, name)}
            >
              Rename
            </button>
            <button className="delete-btn" onClick={() => folderDelete(id)}>
              Delete
            </button>
          </li>
        ))}
        {files.map(({ id, fileName }) => (
          <li key={fileName}>
            <span className="filename">📄{fileName}</span>
            <a
              href={`${url}/file/${id}?action=open`}
              className="open-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open
            </a>
            <a
              href={`${url}/file/${id}?action=download`}
              className="download-link"
            >
              Download
            </a>
            <button
              className="rename-btn"
              onClick={() => fileRename(id, fileName)}
            >
              Rename
            </button>
            <button className="delete-btn" onClick={() => fileDelete(id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DirectoryView;
