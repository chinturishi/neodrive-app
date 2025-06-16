import React, { useEffect, useRef } from "react";
import "./ContextMenu.css";

function ContextMenu({ onClose }) {
  const menuRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="context-menu" ref={menuRef}>
      <div className="context-menu-item" onClick={onClose}>
        Rename
      </div>
      <div className="context-menu-item" onClick={onClose}>
        Delete
      </div>
    </div>
  );
}

export default ContextMenu;
