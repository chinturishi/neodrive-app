import request from "supertest";
import express from "express";
import directoryRoutes from "../routes/directoryRoutes.js";

// Mock all utility functions
jest.mock("../utils.js", () => ({
  addDirectoryToDirectory: jest.fn(),
  deleteDirectory: jest.fn(),
  getDirectoriesList: jest.fn(),
  getDirectoryById: jest.fn(),
  getFileById: jest.fn(),
  getFilesList: jest.fn(),
  getRandomUUID: jest.fn(),
  getRootDirectory: jest.fn(),
  getStoragePath: jest.fn(),
  removeDirectoryFromParentDirectory: jest.fn(),
  updateDirectoryIdInDirectory: jest.fn(),
}));

import {
  addDirectoryToDirectory,
  deleteDirectory,
  getDirectoriesList,
  getDirectoryById,
  getFileById,
  getFilesList,
  getRandomUUID,
  removeDirectoryFromParentDirectory,
  updateDirectoryIdInDirectory,
} from "../utils.js";

describe("Directory Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/directory", directoryRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("GET /directory/:id", () => {
    const mockDirectory = {
      id: "test-dir-id",
      name: "Test Directory",
      parentDir: "parent-id",
    };

    const mockFile = {
      id: "file-1",
      name: "test.txt",
      directoryId: "test-dir-id",
    };

    const mockSubDirectory = {
      id: "sub-dir-1",
      name: "Sub Directory",
    };

    it("should return directory contents with files and subdirectories", async () => {
      getDirectoryById.mockReturnValue(mockDirectory);
      getFilesList.mockReturnValue(["file-1"]);
      getDirectoriesList.mockReturnValue(["sub-dir-1"]);
      getFileById.mockReturnValue(mockFile);

      const response = await request(app)
        .get("/directory/test-dir-id")
        .expect(200);

      expect(response.body).toEqual({
        id: "test-dir-id",
        files: [
          {
            id: "file-1",
            fileName: "test.txt",
            directoryId: "test-dir-id",
          },
        ],
        directories: [
          {
            id: "sub-dir-1",
            name: "Sub Directory",
          },
        ],
      });

      expect(getDirectoryById).toHaveBeenCalledWith("test-dir-id");
      expect(getFilesList).toHaveBeenCalledWith("test-dir-id");
      expect(getDirectoriesList).toHaveBeenCalledWith("test-dir-id");
    });

    it("should return root directory when no id provided", async () => {
      const rootDirectory = {
        id: "a965303d-2899-48f9-902b-bd1992d06778",
        name: "Root Directory",
      };

      getDirectoryById.mockReturnValue(rootDirectory);
      getFilesList.mockReturnValue([]);
      getDirectoriesList.mockReturnValue([]);

      const response = await request(app).get("/directory/").expect(200);

      expect(getDirectoryById).toHaveBeenCalledWith(
        "a965303d-2899-48f9-902b-bd1992d06778"
      );
      expect(response.body.id).toBe("a965303d-2899-48f9-902b-bd1992d06778");
    });

    it("should return 404 when directory not found", async () => {
      getDirectoryById.mockReturnValue(null);

      const response = await request(app)
        .get("/directory/non-existent-id")
        .expect(404);

      expect(response.body.message).toBe("Directory not found");
    });

    it("should handle errors and return 500", async () => {
      getDirectoryById.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/directory/test-id").expect(500);

      expect(response.body.message).toBe("Database error");
    });
  });

  describe("POST /directory/:directoryId", () => {
    it("should create a new directory successfully", async () => {
      const parentDirectoryId = "parent-id";
      const directoryName = "New Folder";
      const newUUID = "new-uuid-123";

      getRandomUUID.mockReturnValue(newUUID);
      addDirectoryToDirectory.mockResolvedValue(true);
      updateDirectoryIdInDirectory.mockResolvedValue(true);

      const response = await request(app)
        .post(`/directory/${parentDirectoryId}`)
        .set("directoryname", directoryName)
        .expect(200);

      expect(response.body.message).toBe("Folder created");
      expect(getRandomUUID).toHaveBeenCalled();
      expect(addDirectoryToDirectory).toHaveBeenCalledWith({
        id: newUUID,
        name: directoryName,
        parentDir: parentDirectoryId,
        files: [],
        directories: [],
      });
      expect(updateDirectoryIdInDirectory).toHaveBeenCalledWith(
        parentDirectoryId,
        newUUID
      );
    });

    it("should use default parent directory when not provided", async () => {
      const directoryName = "New Folder";
      const newUUID = "new-uuid-123";
      const defaultParentId = "a965303d-2899-48f9-902b-bd1992d06778";

      getRandomUUID.mockReturnValue(newUUID);
      addDirectoryToDirectory.mockResolvedValue(true);
      updateDirectoryIdInDirectory.mockResolvedValue(true);

      await request(app)
        .post("/directory/")
        .set("directoryname", directoryName)
        .expect(200);

      expect(addDirectoryToDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          parentDir: defaultParentId,
        })
      );
    });

    it("should handle errors during directory creation", async () => {
      const directoryName = "New Folder";

      getRandomUUID.mockImplementation(() => {
        throw new Error("UUID generation failed");
      });

      const response = await request(app)
        .post("/directory/parent-id")
        .set("directoryname", directoryName)
        .expect(500);

      expect(response.body.message).toBe("UUID generation failed");
    });

    it("should handle missing directory name header", async () => {
      const response = await request(app)
        .post("/directory/parent-id")
        .expect(500);

      // Should handle undefined directoryName gracefully
      expect(response.status).toBe(500);
    });
  });

  describe("DELETE /directory/:id", () => {
    const mockDirectory = {
      id: "dir-to-delete",
      name: "Directory to Delete",
      parentDir: "parent-id",
    };

    it("should delete empty directory successfully", async () => {
      getDirectoryById.mockReturnValue(mockDirectory);
      getFilesList.mockReturnValue([]);
      getDirectoriesList.mockReturnValue([]);
      removeDirectoryFromParentDirectory.mockResolvedValue(true);
      deleteDirectory.mockResolvedValue(true);

      const response = await request(app)
        .delete("/directory/dir-to-delete")
        .expect(200);

      expect(response.body.message).toBe("Folder deleted");
      expect(removeDirectoryFromParentDirectory).toHaveBeenCalledWith(
        "dir-to-delete",
        "parent-id"
      );
      expect(deleteDirectory).toHaveBeenCalledWith("dir-to-delete");
    });

    it("should not delete non-empty directory with files", async () => {
      getDirectoryById.mockReturnValue(mockDirectory);
      getFilesList.mockReturnValue(["file-1", "file-2"]);
      getDirectoriesList.mockReturnValue([]);

      const response = await request(app)
        .delete("/directory/dir-to-delete")
        .expect(500);

      expect(response.body.message).toBe("Non Empty Folder can't be deleted");
      expect(removeDirectoryFromParentDirectory).not.toHaveBeenCalled();
      expect(deleteDirectory).not.toHaveBeenCalled();
    });

    it("should not delete non-empty directory with subdirectories", async () => {
      getDirectoryById.mockReturnValue(mockDirectory);
      getFilesList.mockReturnValue([]);
      getDirectoriesList.mockReturnValue(["sub-dir-1"]);

      const response = await request(app)
        .delete("/directory/dir-to-delete")
        .expect(500);

      expect(response.body.message).toBe("Non Empty Folder can't be deleted");
    });

    it("should not delete directory with both files and subdirectories", async () => {
      getDirectoryById.mockReturnValue(mockDirectory);
      getFilesList.mockReturnValue(["file-1"]);
      getDirectoriesList.mockReturnValue(["sub-dir-1"]);

      const response = await request(app)
        .delete("/directory/dir-to-delete")
        .expect(500);

      expect(response.body.message).toBe("Non Empty Folder can't be deleted");
    });

    it("should return 500 when directory not found", async () => {
      getDirectoryById.mockReturnValue(null);

      const response = await request(app)
        .delete("/directory/non-existent")
        .expect(500);

      expect(response.body.message).toBe("Folder not found");
    });

    it("should handle errors during deletion process", async () => {
      getDirectoryById.mockReturnValue(mockDirectory);
      getFilesList.mockReturnValue([]);
      getDirectoriesList.mockReturnValue([]);
      removeDirectoryFromParentDirectory.mockRejectedValue(
        new Error("Deletion failed")
      );

      const response = await request(app)
        .delete("/directory/dir-to-delete")
        .expect(500);

      expect(response.body.message).toBe("Folder not found");
    });

    it("should handle getDirectoryById throwing error", async () => {
      getDirectoryById.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const response = await request(app)
        .delete("/directory/some-id")
        .expect(500);

      expect(response.body.message).toBe("Folder not found");
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed directory ID", async () => {
      getDirectoryById.mockReturnValue(null);

      await request(app).get("/directory/malformed-id-123!@#").expect(404);
    });

    it("should handle empty directory name in POST", async () => {
      const newUUID = "uuid-123";
      getRandomUUID.mockReturnValue(newUUID);
      addDirectoryToDirectory.mockResolvedValue(true);
      updateDirectoryIdInDirectory.mockResolvedValue(true);

      await request(app)
        .post("/directory/parent-id")
        .set("directoryname", "")
        .expect(200);

      expect(addDirectoryToDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "",
        })
      );
    });
  });
});
