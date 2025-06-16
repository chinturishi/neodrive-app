import React, { useState, useRef, useCallback, useEffect } from "react";
import { FiFolderPlus, FiUpload } from "react-icons/fi";
import ContextMenu from "./ContextMenu";
import NewFolderModal from "./NewFolderModal";
import "./DirectoryView.css";
import { useParams } from "react-router-dom";

function DirectoryView() {
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const fileInputRef = useRef();
  const url = "http://192.168.0.103:5000";
  const { "*": dirPath } = useParams();
  const [directories, setDirectories] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renameText, setRenameText] = useState("");
  const [renameFileId, setRenameFileId] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentDirectoryId, setCurrentDirectoryId] = useState("");
  const [isFolderRenaming, setIsFolderRenaming] = useState(false);

  // Fetch folder items
  const getFolderItems = useCallback(async () => {
    try {
      const res = await fetch(
        `${url}/directory${dirPath ? "/" + dirPath : "/"}`
      );
      const data = await res.json();
      console.log(data);
      setFiles(data.files);
      setDirectories(data.directories);
      setCurrentDirectoryId(data.id);
    } catch (err) {
      alert("Failed to fetch directory contents");
    }
  }, [url, dirPath]);
  useEffect(() => {
    getFolderItems();
  }, [getFolderItems]);

  const handleMenuClick = (idx) => {
    setMenuOpenIdx(idx === menuOpenIdx ? null : idx);
  };

  const handleCloseMenu = () => {
    setMenuOpenIdx(null);
  };

  const handleNewFolder = () => {
    setShowNewFolder(true);
  };

  const handleCloseNewFolder = () => {
    setShowNewFolder(false);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  //const directories = ["New Folder2", "New Folder"];

  return (
    <div className="directory-view">
      <div className="directory-header">
        <h2 className="directory-title">Neo Drive</h2>
        <div className="directory-actions">
          <button
            className="icon-btn"
            title="New Folder"
            onClick={handleNewFolder}
          >
            <FiFolderPlus />
          </button>
          <button
            className="icon-btn"
            title="Upload"
            onClick={handleUploadClick}
          >
            <FiUpload />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            multiple
          />
        </div>
      </div>
      <hr className="directory-divider" />
      <div className="directory-list">
        {directories.map(({ id, name }) => (
          <div className="directory-item" key={name}>
            <div className="directory-item-info">
              <span className="folder-icon">📁</span>
              <span className="folder-name">{name}</span>
            </div>
            <span
              className="item-menu"
              title="More"
              onClick={() => handleMenuClick(id)}
              style={{ position: "relative" }}
            >
              ⋮{menuOpenIdx === id && <ContextMenu onClose={handleCloseMenu} />}
            </span>
          </div>
        ))}
      </div>
      {showNewFolder && <NewFolderModal onClose={handleCloseNewFolder} />}
    </div>
  );
}

export default DirectoryView;
