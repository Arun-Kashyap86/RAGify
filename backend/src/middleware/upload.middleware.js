const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        cb(
            null,
            uniqueName + path.extname(file.originalname)
        );
    }
});

const fileFilter = (req, file, cb) => {
    const extension =
        path.extname(file.originalname).toLowerCase();

    if (extension === ".pdf") {
        cb(null, true);
    } else {
        cb(
            new Error("Only PDF files are allowed"),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

module.exports = upload;