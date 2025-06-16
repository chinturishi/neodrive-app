import { useState } from "react";
import "./App.css";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

function DirectoryView() {
  const [folderItems, setFolderItems] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renameText, setRenameText] = useState("");
  const [oldNameText, setOldNameText] = useState("");
  const url = "http://[2406:7400:63:cee4:1c4e:9fdc:851:681]:5000";
  const { "*": dirPath } = useParams();
  console.log("dirPath", dirPath);

  async function getFolderItems() {
    const res = await fetch(`${url}/directory${dirPath ? "/" + dirPath : ""}/`);
    const data = await res.json();
    console.log(data);
    setFolderItems(data);
  }

  const fileUpload = async (e) => {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url + "/files/" + file.name, true);
    xhr.addEventListener("load", (e) => {
      getFolderItems();
    });
    xhr.upload.addEventListener("progress", (e) => {
      console.log("progress");
      const progress = (e.loaded / e.total) * 100;
      setUploadProgress(progress.toFixed(2));
      console.log(`${progress.toFixed(2)}% Uploaded`);
    });
    xhr.send(file);
  };

  const fileDelete = async (item) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "DELETE",
      `${url}/files/${dirPath ? dirPath + "/" : ""}${item}`,
      true
    );
    xhr.addEventListener("load", (e) => {
      console.log("load");
      getFolderItems();
    });
    xhr.send();
  };

  const fileRename = async (item) => {
    setRenameText(item);
    setOldNameText(`./${dirPath ? dirPath + "/" : ""}${item}`);
  };

  const fileRenameSave = async (rename) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", `${url}/files/${oldNameText}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.addEventListener("load", (e) => {
      console.log("load");
      console.log(e);
      console.log(xhr.response);
      getFolderItems();
      setRenameText("");
    });
    const data = { newFileName: rename };
    xhr.send(JSON.stringify(data));
    xhr.send();
  };

  useEffect(() => {
    console.log("first");
    getFolderItems();
  }, []);

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
        <button
          className="save-btn"
          onClick={() =>
            fileRenameSave(`/${dirPath ? dirPath + "/" : ""}${renameText}`)
          }
        >
          Save
        </button>
      </div>
      <ul>
        {folderItems.map(({ item, isDirectory }) => (
          <li key={item}>
            <span className="filename">
              {isDirectory ? "📁" : "📄"} {item}
            </span>
            <a
              href={
                !isDirectory
                  ? `${url}/files/${
                      dirPath ? dirPath + "/" : ""
                    }${item}?action=open`
                  : `./${dirPath ? dirPath + "/" : ""}${item}`
              }
              className="open-link"
            >
              Open
            </a>
            {/* <Link
              to={
                !isDirectory
                  ? `${url}/files/${
                      dirPath ? dirPath + "/" : ""
                    }${item}?action=open`
                  : `./${item}`
              }
              className="open-link"
            >
              Open
            </Link> */}
            {!isDirectory && (
              <a
                href={`${url}/files/${
                  dirPath ? dirPath + "/" : ""
                }${item}?action=download`}
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
