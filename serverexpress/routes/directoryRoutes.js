import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

/**
 * Validate directory ID and check if it exists
 */
const validateDirectoryId = async (req, res, next, id) => {
  try {
    if (!id) {
      return next();
    }

    const db = req.db;
    const directories = db.collection("directories");

    let directoryId;
    try {
      directoryId = ObjectId.createFromHexString(id);
    } catch (err) {
      return res.status(400).json({ message: "Invalid directory ID format" });
    }

    const directory = await directories.findOne({ _id: directoryId });

    if (!directory) {
      return res.status(404).json({ message: "Directory not found" });
    }

    req.directory = directory;
    next();
  } catch (err) {
    res.status(500).json({ message: "Error validating directory" });
  }
};

/**
 * Check if user has access to the directory
 */
const checkDirectoryAccess = async (req, res, next) => {
  try {
    const directory = req.directory;

    if (!directory) {
      return next(); // Skip if no directory (will be handled by route handler)
    }

    const userId = res.user._id.toString();

    if (directory.userId && directory.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "This directory is not accessible" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Error checking directory access" });
  }
};

/**
 * @route   GET /directory/:id?
 * @desc    Get directory contents
 * @access  Private
 */
router.get("{/:id}", async (req, res) => {
  try {
    const db = req.db;
    const directories = db.collection("directories");
    const files = db.collection("files");
    const user = res.user;
    const userId = user._id.toString();

    // If directory already loaded by param middleware
    let directory = req.directory;

    // If no ID provided or invalid, get user's root directory
    if (!directory) {
      directory = await directories.findOne({
        _id: ObjectId.createFromHexString(user.directoryId.toString()),
      });

      if (!directory) {
        return res.status(404).json({ message: "Root directory not found" });
      }
    }

    // Check access
    if (directory.userId && directory.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "This directory is not accessible" });
    }

    // Get files in directory
    const filesList = directory.files || [];
    const directoriesList = directory.directories || [];

    // Get file details
    const finalList = await Promise.all(
      filesList.map(async (fileId) => {
        try {
          const file = await files.findOne({
            _id: ObjectId.createFromHexString(fileId.toString()),
          });

          if (!file) return null;

          return {
            id: file._id.toString(),
            fileName: file.name,
            directoryId: file.directoryId.toString(),
            extension: file.extension,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
          };
        } catch (err) {
          return null;
        }
      })
    );

    // Get subdirectory details
    const finalDirectoriesList = await Promise.all(
      directoriesList.map(async (directoryId) => {
        try {
          const dir = await directories.findOne({
            _id: ObjectId.createFromHexString(directoryId.toString()),
          });

          if (!dir) return null;

          return {
            id: dir._id.toString(),
            name: dir.name,
            createdAt: dir.createdAt,
            updatedAt: dir.updatedAt,
          };
        } catch (err) {
          return null;
        }
      })
    );

    // Filter out null values (missing files/directories)
    const finalData = {
      id: directory._id.toString(),
      name: directory.name,
      files: finalList.filter(Boolean),
      directories: finalDirectoriesList.filter(Boolean),
      parentDir: directory.parentDir ? directory.parentDir.toString() : null,
    };

    res.json(finalData);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving directory contents" });
  }
});

/**
 * @route   POST /directory/:directoryId?
 * @desc    Create a new folder in the specified directory
 * @access  Private
 */
router.post("/:directoryId", async (req, res) => {
  try {
    const db = req.db;
    const directories = db.collection("directories");
    const user = res.user;

    // Get parent directory ID (from param or user's root dir)
    const directoryId = req.params.directoryId || user.directoryId.toString();
    const { directoryname: directoryName } = req.headers;

    if (!directoryName) {
      return res.status(400).json({ message: "Directory name is required" });
    }

    // Verify parent directory exists
    let parentDirId;
    try {
      parentDirId = ObjectId.createFromHexString(directoryId);
    } catch (err) {
      return res.status(400).json({ message: "Invalid parent directory ID" });
    }

    const parentDir = await directories.findOne({ _id: parentDirId });

    if (!parentDir) {
      return res.status(404).json({ message: "Parent directory not found" });
    }

    // Check if user has access to parent directory
    if (
      parentDir.userId &&
      parentDir.userId.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You don't have permission to create folders here" });
    }

    // Create new directory
    const newDirectory = {
      name: directoryName,
      parentDir: parentDirId,
      files: [],
      directories: [],
      userId: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId: childDirectoryId } = await directories.insertOne(
      newDirectory
    );

    // Update parent directory
    await directories.updateOne(
      { _id: parentDirId },
      { $push: { directories: childDirectoryId } }
    );

    res.status(201).json({
      message: "Folder created",
      directoryId: childDirectoryId.toString(),
      directoryName,
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating folder" });
  }
});

/**
 * @route   DELETE /directory/:id
 * @desc    Delete a directory
 * @access  Private
 */
router.delete(
  "/:id",
  validateDirectoryId,
  checkDirectoryAccess,
  async (req, res) => {
    try {
      const db = req.db;
      const directories = db.collection("directories");
      const directory = req.directory;

      // Check if directory is empty
      if (
        (directory.files && directory.files.length > 0) ||
        (directory.directories && directory.directories.length > 0)
      ) {
        return res
          .status(400)
          .json({ message: "Cannot delete non-empty directory" });
      }

      // Remove directory from parent
      if (directory.parentDir) {
        await directories.updateOne(
          { _id: directory.parentDir },
          { $pull: { directories: directory._id } }
        );
      }

      // Delete directory
      const result = await directories.deleteOne({ _id: directory._id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Directory not found" });
      }

      res.json({ message: "Directory deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting directory" });
    }
  }
);

/**
 * @route   PATCH /directory/:id
 * @desc    Rename a directory
 * @access  Private
 */
router.patch(
  "/:id",
  validateDirectoryId,
  checkDirectoryAccess,
  async (req, res) => {
    try {
      const db = req.db;
      const directories = db.collection("directories");
      const directory = req.directory;

      if (!req.body.NewDirectoryName) {
        return res
          .status(400)
          .json({ message: "New directory name is required" });
      }

      const result = await directories.updateOne(
        { _id: directory._id },
        {
          $set: {
            name: req.body.NewDirectoryName,
            updatedAt: new Date(),
          },
        }
      );

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .json({ message: "Directory not found or no changes made" });
      }

      res.json({
        message: "Directory renamed successfully",
        newName: req.body.NewDirectoryName,
      });
    } catch (err) {
      res.status(500).json({ message: "Error renaming directory" });
    }
  }
);

// Register param middleware
router.param("id", validateDirectoryId);

export default router;
