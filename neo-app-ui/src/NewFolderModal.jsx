import React, { useRef, useEffect, useState } from "react";
import "./NewFolderModal.css";

function NewFolderModal({ onClose }) {
  const [folderName, setFolderName] = useState("");
  const modalRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <h3 className="modal-title">Directory Name</h3>
        <input
          className="modal-input"
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Enter folder name"
        />
        <div className="modal-actions">
          <button className="modal-btn create" onClick={onClose}>
            Create
          </button>
          <button className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewFolderModal;
