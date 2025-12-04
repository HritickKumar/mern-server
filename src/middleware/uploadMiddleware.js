import multer from "multer";

const storage = multer.memoryStorage(); // we only need buffer, then upload to cloud

export const upload = multer({
    storage,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1 MB
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"));
        }
        cb(null, true);
    },
});
