import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { Link, useParams } from "react-router-dom";

function DirectoryView() {
  const [folderItems, setFolderItems] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renameText, setRenameText] = useState("");
  const [oldNameText, setOldNameText] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  //const url = "http://[2406:7400:63:cee4:1c4e:9fdc:851:681]:4000";
  const url = "http://192.168.0.103:5000";
  const { "*": dirPath } = useParams();

  // Helper to build a path
  const buildPath = useCallback(
    (item = "") => (dirPath ? `${dirPath}/${item}` : item),
    [dirPath]
  );

  // Fetch folder items
  const getFolderItems = useCallback(async () => {
    const res = await fetch(`${url}/directory${dirPath ? "/" + dirPath : ""}/`);
    const data = await res.json();
    console.log(data);
    setFolderItems(data);
  }, [url, dirPath]);

  // File upload
  const fileUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${url}/files/${buildPath(file.name)}`, true);
      xhr.addEventListener("load", getFolderItems);
      xhr.upload.addEventListener("progress", (e) => {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(progress.toFixed(2));
      });
      xhr.send(file);
    },
    [url, buildPath, getFolderItems]
  );

  // File/folder delete
  const fileDelete = useCallback(
    async (item) => {
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", `${url}/files/${buildPath(item)}`, true);
      xhr.addEventListener("load", getFolderItems);
      xhr.send();
    },
    [url, buildPath, getFolderItems]
  );

  // Add folder
  const addFolder = useCallback(async () => {
    console.log("add folder" + buildPath(newFolderName));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/directory/${buildPath(newFolderName)}`, true);
    xhr.addEventListener("load", getFolderItems);
    xhr.send();
  }, [url, buildPath, getFolderItems, newFolderName]);

  // Prepare rename
  const fileRename = useCallback(
    (item) => {
      setRenameText(item);
      setOldNameText(buildPath(item));
    },
    [buildPath]
  );

  // Save rename
  const fileRenameSave = useCallback(
    (rename) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", `${url}/files/${oldNameText}`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener("load", () => {
        getFolderItems();
        setRenameText("");
      });
      const data = { newFileName: buildPath(rename) };
      xhr.send(JSON.stringify(data));
    },
    [url, oldNameText, getFolderItems, buildPath]
  );

  useEffect(() => {
    getFolderItems();
  }, [getFolderItems]);

  return (
    <>
      <h1>NeoDrive Files</h1>
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
        <button className="save-btn" onClick={() => fileRenameSave(renameText)}>
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
        {folderItems.map(({ item, isDirectory }) => (
          <li key={item}>
            <span className="filename">
              {isDirectory ? "📁" : "📄"} {item}
            </span>
            {isDirectory ? (
              <Link to={`/${buildPath(item)}`} className="open-link">
                Open
              </Link>
            ) : (
              <a
                href={`${url}/files/${buildPath(item)}?action=open`}
                className="open-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
            )}
            {!isDirectory && (
              <a
                href={`${url}/files/${buildPath(item)}?action=download`}
                className="download-link"
              >
                Download
              </a>
            )}
            <button className="rename-btn" onClick={() => fileRename(item)}>
              Rename
            </button>
            <button className="delete-btn" onClick={() => fileDelete(item)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default DirectoryView;
