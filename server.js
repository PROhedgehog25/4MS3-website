const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Chess } = require("chess.js");

const app = express();
const PORT = 3000;

app.use(express.json());


/* =========================================
   FOLDERS
========================================= */

const pendingFolder =
    path.join(__dirname, "uploads", "pending");

const approvedFolder =
    path.join(__dirname, "uploads", "approved");


fs.mkdirSync(pendingFolder, {
    recursive: true
});

fs.mkdirSync(approvedFolder, {
    recursive: true
});


/* =========================================
   FILE UPLOAD SETTINGS
========================================= */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, pendingFolder);

    },

    filename: (req, file, cb) => {

        const extension =
            path.extname(file.originalname);

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            extension;

        cb(null, uniqueName);

    }

});


const upload = multer({

    storage: storage,

    limits: {

        /* 50 MB for images, MP3 and MP4 */

        fileSize:
            50 * 1024 * 1024

    },

    fileFilter: (req, file, cb) => {

        const isImage =
            file.mimetype.startsWith(
                "image/"
            );

        const isMP3 =
            file.mimetype ===
                "audio/mpeg" ||
            file.originalname
                .toLowerCase()
                .endsWith(".mp3");

        const isMP4 =
            file.mimetype ===
                "video/mp4" ||
            file.originalname
                .toLowerCase()
                .endsWith(".mp4");


        if (
            isImage ||
            isMP3 ||
            isMP4
        ) {

            cb(
                null,
                true
            );

        } else {

            cb(
                new Error(
                    "Only image, MP3 and MP4 files are allowed."
                )
            );

        }

    }

});


/* =========================================
   WEBSITE
========================================= */

app.use(
    express.static(__dirname)
);


/* =========================================
   UPLOAD PHOTO
========================================= */

app.post(
    "/upload",
    upload.single("photo"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "No photo was uploaded."

            });

        }


        const name =
            String(
                req.body.name ||
                "Anonymous"
            )
            .trim()
            .slice(0, 30) ||
            "Anonymous";


        const metadataPath =
            path.join(
                pendingFolder,
                `${req.file.filename}.json`
            );


        try {

            fs.writeFileSync(

                metadataPath,

                JSON.stringify(

                    {
                        name: name,

                        originalName:
                            req.file.originalname,

                        submittedAt:
                            new Date().toISOString()
                    },

                    null,

                    2

                ),

                "utf8"

            );


            console.log(
                `📥 New photo from ${name}: ${req.file.filename}`
            );


            res.json({

                success: true,

                message:
                    "Photo submitted for review."

            });


        } catch (error) {

            console.error(error);


            try {

                fs.unlinkSync(
                    path.join(
                        pendingFolder,
                        req.file.filename
                    )
                );

            } catch (_) {}


            res.status(500).json({

                success: false,

                message:
                    "Couldn't save photo information."

            });

        }

    }
);


/* =========================================
   LIST PENDING PHOTOS
========================================= */

app.get(
    "/api/pending",
    (req, res) => {

        try {

            const files =
                fs.readdirSync(
                    pendingFolder
                );


            const photos = files

                .filter(file => {

                    return /\.(jpg|jpeg|png|webp|gif|mp3|mp4)$/i
                        .test(file);

                })

                .map(file => {

                    const metadataPath =
                        path.join(
                            pendingFolder,
                            `${file}.json`
                        );


                    let metadata = {

                        name:
                            "Anonymous"

                    };


                    if (
                        fs.existsSync(
                            metadataPath
                        )
                    ) {

                        try {

                            metadata =
                                JSON.parse(

                                    fs.readFileSync(

                                        metadataPath,

                                        "utf8"

                                    )

                                );

                        } catch (error) {

                            console.error(
                                `Couldn't read metadata for ${file}:`,
                                error
                            );

                        }

                    }


                    return {

                        filename:
                            file,

                        name:
                            metadata.name ||
                            "Anonymous",

                        originalName:
                            metadata.originalName ||
                            file,

                        submittedAt:
                            metadata.submittedAt ||
                            null

                    };

                });


            res.json(photos);


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Couldn't read pending photos."

            });

        }

    }
);


/* =========================================
   SERVE PENDING PHOTOS
========================================= */

app.use(
    "/pending",
    express.static(pendingFolder)
);


/* =========================================
   SERVE APPROVED PHOTOS
========================================= */

app.use(
    "/approved",
    express.static(approvedFolder)
);


/* =========================================
   GET APPROVED PHOTOS
========================================= */

app.get(
    "/api/approved",
    (req, res) => {

        try {

            const files =
                fs.readdirSync(
                    approvedFolder
                );


            const photos = files

                .filter(file => {

                    return /\.(jpg|jpeg|png|webp|gif|mp3|mp4)$/i
                        .test(file);

                })

                .map(file => {

                    const metadataPath =
                        path.join(
                            approvedFolder,
                            `${file}.json`
                        );


                    let metadata = {

                        name:
                            "4MS3"

                    };


                    if (
                        fs.existsSync(
                            metadataPath
                        )
                    ) {

                        try {

                            metadata =
                                JSON.parse(
                                    fs.readFileSync(
                                        metadataPath,
                                        "utf8"
                                    )
                                );

                        } catch (error) {

                            console.error(
                                "Metadata error:",
                                error
                            );

                        }

                    }


                    return {

                        filename:
                            file,

                        name:
                            metadata.name ||
                            "4MS3"

                    };

                });


            res.json(photos);


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Couldn't load approved photos."

            });

        }

    }
);


/* =========================================
   LIST APPROVED PHOTOS
========================================= */

app.get(
    "/api/approved",
    (req, res) => {

        try {

            const files =
                fs.readdirSync(
                    approvedFolder
                );


            const photos = files

                .filter(file => {

                    return /\.(jpg|jpeg|png|webp|gif|mp3|mp4)$/i
                        .test(file);

                })

                .map(file => {

                    const metadataPath =
                        path.join(
                            approvedFolder,
                            `${file}.json`
                        );


                    let metadata = {

                        name:
                            "4MS3"

                    };


                    if (
                        fs.existsSync(
                            metadataPath
                        )
                    ) {

                        try {

                            metadata =
                                JSON.parse(

                                    fs.readFileSync(
                                        metadataPath,
                                        "utf8"
                                    )

                                );

                        } catch (error) {

                            console.error(
                                error
                            );

                        }

                    }


                    const extension =
    path.extname(file)
        .toLowerCase();


let type =
    "image";


if (
    extension === ".mp3"
) {

    type = "audio";

}


else if (
    extension === ".mp4"
) {

    type = "video";

}


return {

    filename:
        file,

    name:
        metadata.name ||
        "4MS3",

    type:
        type

};

                });


            res.json(photos);


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Couldn't load approved photos."

            });

        }

    }
);


/* =========================================
   APPROVE PHOTO
========================================= */

app.post(
    "/api/approve",
    (req, res) => {

        const filename =
            path.basename(
                req.body.filename || ""
            );


        if (!filename) {

            return res.status(400).json({

                success: false,

                message:
                    "Missing filename."

            });

        }


        const source =
            path.join(
                pendingFolder,
                filename
            );


        const destination =
            path.join(
                approvedFolder,
                filename
            );


        const metadataSource =
            path.join(
                pendingFolder,
                `${filename}.json`
            );


        const metadataDestination =
            path.join(
                approvedFolder,
                `${filename}.json`
            );


        if (
            !fs.existsSync(source)
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Photo not found."

            });

        }


        try {

            fs.renameSync(
                source,
                destination
            );


            if (
                fs.existsSync(
                    metadataSource
                )
            ) {

                fs.renameSync(
                    metadataSource,
                    metadataDestination
                );

            }


            console.log(
                `✅ Approved: ${filename}`
            );


            res.json({

                success: true

            });


        } catch (error) {

            console.error(error);


            try {

                if (

                    fs.existsSync(
                        destination
                    )

                    &&

                    !fs.existsSync(
                        source
                    )

                ) {

                    fs.renameSync(
                        destination,
                        source
                    );

                }

            } catch (_) {}


            res.status(500).json({

                success: false,

                message:
                    "Couldn't approve photo."

            });

        }

    }
);


/* =========================================
   REJECT PHOTO
========================================= */

app.post(
    "/api/reject",
    (req, res) => {

        const filename =
            path.basename(
                req.body.filename || ""
            );


        if (!filename) {

            return res.status(400).json({

                success: false,

                message:
                    "Missing filename."

            });

        }


        const filePath =
            path.join(
                pendingFolder,
                filename
            );


        const metadataPath =
            path.join(
                pendingFolder,
                `${filename}.json`
            );


        if (
            !fs.existsSync(filePath)
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Photo not found."

            });

        }


        try {

            fs.unlinkSync(
                filePath
            );


            if (
                fs.existsSync(
                    metadataPath
                )
            ) {

                fs.unlinkSync(
                    metadataPath
                );

            }


            console.log(
                `❌ Rejected: ${filename}`
            );


            res.json({

                success: true

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Couldn't reject photo."

            });

        }

    }
);


/* =========================================
   ASSETS SYSTEM
========================================= */

const assetsFolder =
    path.join(
        __dirname,
        "assets",
        "files"
    );


fs.mkdirSync(
    assetsFolder,
    {
        recursive: true
    }
);


/* Serve downloadable assets */

app.use(
    "/assets/files",
    express.static(assetsFolder)
);


/* =========================================
   FORCE ASSET DOWNLOAD
========================================= */

app.get(
    "/api/assets/download/:filename",
    (req, res) => {

        const filename =
            path.basename(
                req.params.filename
            );


        const filePath =
            path.join(
                assetsFolder,
                filename
            );


        if (
            !fs.existsSync(filePath)
        ) {

            return res.status(404).send(
                "Asset not found."
            );

        }


        res.download(
            filePath,
            filename,
            error => {

                if (error) {

                    console.error(
                        "Asset download error:",
                        error
                    );

                }

            }
        );

    }
);


/* =========================================
   ASSET UPLOAD
========================================= */

const assetStorage =
    multer.diskStorage({

        destination: (
            req,
            file,
            cb
        ) => {

            cb(
                null,
                assetsFolder
            );

        },

        filename: (
            req,
            file,
            cb
        ) => {

            const extension =
                path.extname(
                    file.originalname
                );


            const cleanName =
                path.basename(
                    file.originalname,
                    extension
                )
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                );


            cb(

                null,

                cleanName +
                "-" +
                Date.now() +
                extension

            );

        }

    });


const assetUpload =
    multer({

        storage:
            assetStorage,

        limits: {

            fileSize:
                50 *
                1024 *
                1024

        }

    });


/* =========================================
   GET ASSETS
========================================= */

app.get(
    "/api/assets",
    (req, res) => {

        try {

            const files =
                fs.readdirSync(
                    assetsFolder
                );


            const assets =
                files

                    .filter(
                        file => {

                            return (
                                file !== ".gitkeep" &&
                                !file.endsWith(".json")
                            );

                        }
                    )

                    .map(
                        file => {

                            const filePath =
                                path.join(
                                    assetsFolder,
                                    file
                                );


                            const stats =
                                fs.statSync(
                                    filePath
                                );


                            const metadataPath =
                                path.join(
                                    assetsFolder,
                                    `${file}.json`
                                );


                            let metadata = {

                                title:
                                    path.parse(file).name,

                                category:
                                    "Other"

                            };


                            if (
                                fs.existsSync(
                                    metadataPath
                                )
                            ) {

                                try {

                                    metadata =
                                        JSON.parse(
                                            fs.readFileSync(
                                                metadataPath,
                                                "utf8"
                                            )
                                        );

                                } catch (_) {}

                            }


                            return {

                                filename:
                                    file,

                                title:
                                    metadata.title ||
                                    path.parse(file).name,

                                category:
                                    metadata.category ||
                                    "Other",

                                size:
                                    stats.size

                            };

                        }
                    );


            res.json(
                assets
            );


        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Couldn't load assets."

            });

        }

    }
);


/* =========================================
   UPLOAD ASSET
========================================= */

app.post(
    "/api/assets/upload",
    assetUpload.single("asset"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "No asset was uploaded."

            });

        }


        const title =
            String(
                req.body.title ||
                req.file.originalname
            )
            .trim()
            .slice(0, 80);


        const category =
            String(
                req.body.category ||
                "Other"
            )
            .trim()
            .slice(0, 30);


        const metadataPath =
            path.join(
                assetsFolder,
                `${req.file.filename}.json`
            );


        try {

            fs.writeFileSync(

                metadataPath,

                JSON.stringify(

                    {

                        title:
                            title,

                        category:
                            category,

                        originalName:
                            req.file.originalname,

                        uploadedAt:
                            new Date().toISOString()

                    },

                    null,

                    2

                ),

                "utf8"

            );


            console.log(
                `📦 New asset: ${title}`
            );


            res.json({

                success: true,

                message:
                    "Asset uploaded."

            });


        } catch (error) {

            console.error(
                error
            );


            try {

                fs.unlinkSync(
                    req.file.path
                );

            } catch (_) {}


            res.status(500).json({

                success: false,

                message:
                    "Couldn't save asset."

            });

        }

    }
);


/* =========================================
   DELETE ASSET
========================================= */

app.delete(
    "/api/assets/:filename",
    (req, res) => {

        const filename =
            path.basename(
                req.params.filename
            );


        const filePath =
            path.join(
                assetsFolder,
                filename
            );


        const metadataPath =
            path.join(
                assetsFolder,
                `${filename}.json`
            );


        if (
            !fs.existsSync(filePath)
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Asset not found."

            });

        }


        try {

            fs.unlinkSync(
                filePath
            );


            if (
                fs.existsSync(
                    metadataPath
                )
            ) {

                fs.unlinkSync(
                    metadataPath
                );

            }


            console.log(
                `🗑️ Deleted asset: ${filename}`
            );


            res.json({

                success: true

            });


        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Couldn't delete asset."

            });

        }

    }
);


/* =========================================
   LEADERBOARD SYSTEM
========================================= */

const leaderboardFile =
    path.join(
        __dirname,
        "leaderboard.json"
    );


if (!fs.existsSync(leaderboardFile)) {

    fs.writeFileSync(
        leaderboardFile,
        "[]",
        "utf8"
    );

}


/* =========================================
   GET LEADERBOARD
========================================= */

app.get(
    "/api/leaderboard",
    (req, res) => {

        try {

            const data =
                fs.readFileSync(
                    leaderboardFile,
                    "utf8"
                );


            const leaderboard =
                JSON.parse(data);


            leaderboard.sort(
                (a, b) =>
                    Number(b.grade) -
                    Number(a.grade)
            );


            res.json(
                leaderboard
            );


        } catch (error) {

            console.error(
                "Leaderboard load error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Couldn't load leaderboard."

            });

        }

    }
);


/* =========================================
   CHECK STUDENT NAME
========================================= */

app.post(
    "/api/check-name",
    (req, res) => {

        try {

            const submittedName =
                String(
                    req.body.name || ""
                )
                .trim();


            if (!submittedName) {

                return res.status(400).json({

                    success: false,

                    available: false,

                    message:
                        "Please enter your name."

                });

            }


            const data =
                fs.readFileSync(
                    leaderboardFile,
                    "utf8"
                );


            const leaderboard =
                JSON.parse(data);


            const normalizedName =
                submittedName
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .toLowerCase();


            const student =
                leaderboard.find(
                    entry => {

                        const existingName =
                            String(
                                entry.name || ""
                            )
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim()
                            .toLowerCase();


                        return (
                            existingName ===
                            normalizedName
                        );

                    }
                );


            if (!student) {

                return res.json({

                    success: true,

                    available: false,

                    message:
                        "That name isn't on the 4MS3 class list."

                });

            }


            res.json({

                success: true,

                available: true,

                name:
                    student.name

            });


        } catch (error) {

            console.error(
                "Name check error:",
                error
            );


            res.status(500).json({

                success: false,

                available: false,

                message:
                    "Couldn't verify the name."

            });

        }

    }
);


/* =========================================
   SAVE LEADERBOARD
========================================= */

app.post(
    "/api/leaderboard",
    (req, res) => {

        try {

            if (
                !Array.isArray(
                    req.body
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid leaderboard data."

                });

            }


            const cleaned =
                req.body

                    .map(
                        student => {

                            return {

                                name:
                                    String(
                                        student.name ||
                                        ""
                                    )
                                    .trim()
                                    .slice(
                                        0,
                                        80
                                    ),

                                grade:
                                    Number(
                                        student.grade
                                    )

                            };

                        }
                    )

                    .filter(
                        student => {

                            return (

                                student.name &&

                                Number.isFinite(
                                    student.grade
                                ) &&

                                student.grade >=
                                    0 &&

                                student.grade <=
                                    20

                            );

                        }
                    );


            cleaned.sort(
                (a, b) =>
                    b.grade -
                    a.grade
            );


            fs.writeFileSync(

                leaderboardFile,

                JSON.stringify(
                    cleaned,
                    null,
                    4
                ),

                "utf8"

            );


            console.log(
                "🏆 Leaderboard updated."
            );


            res.json({

                success:
                    true,

                leaderboard:
                    cleaned

            });


        } catch (error) {

            console.error(
                "Leaderboard save error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't save leaderboard."

            });

        }

    }
);


/* =========================================
   NOTIFICATION SYSTEM
========================================= */

const notificationsFile =
    path.join(
        __dirname,
        "notifications.json"
    );


if (!fs.existsSync(notificationsFile)) {

    fs.writeFileSync(
        notificationsFile,
        "[]",
        "utf8"
    );

}


/* =========================================
   GET NOTIFICATIONS
========================================= */

app.get(
    "/api/notifications",
    (req, res) => {

        try {

            const data =
                fs.readFileSync(
                    notificationsFile,
                    "utf8"
                );


            const notifications =
                JSON.parse(data);


            notifications.sort(
                (a, b) =>
                    new Date(
                        b.createdAt
                    ) -
                    new Date(
                        a.createdAt
                    )
            );


            res.json(
                notifications
            );


        } catch (error) {

            console.error(
                "Notification load error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Couldn't load notifications."

            });

        }

    }
);


/* =========================================
   CREATE NOTIFICATION
========================================= */

app.post(
    "/api/notifications",
    (req, res) => {

        try {

            const title =
                String(
                    req.body.title || ""
                )
                .trim()
                .slice(
                    0,
                    100
                );


            const message =
                String(
                    req.body.message || ""
                )
                .trim()
                .slice(
                    0,
                    300
                );


            const type =
                String(
                    req.body.type ||
                    "info"
                )
                .trim()
                .slice(
                    0,
                    30
                );


            if (
                !title ||
                !message
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Title and message are required."

                });

            }


            const data =
                fs.readFileSync(
                    notificationsFile,
                    "utf8"
                );


            const notifications =
                JSON.parse(data);


            const notification = {

                id:
                    Date.now().toString(),

                title:
                    title,

                message:
                    message,

                type:
                    type,

                createdAt:
                    new Date().toISOString()

            };


            notifications.push(
                notification
            );


            const limited =
                notifications.slice(
                    -100
                );


            fs.writeFileSync(

                notificationsFile,

                JSON.stringify(
                    limited,
                    null,
                    4
                ),

                "utf8"

            );


            console.log(
                `🔔 New notification: ${title}`
            );


            res.json({

                success:
                    true,

                notification:
                    notification

            });


        } catch (error) {

            console.error(
                "Notification save error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't create notification."

            });

        }

    }
);


/* =========================================
   DELETE NOTIFICATION
========================================= */

app.delete(
    "/api/notifications/:id",
    (req, res) => {

        try {

            const id =
                String(
                    req.params.id
                );


            const data =
                fs.readFileSync(
                    notificationsFile,
                    "utf8"
                );


            const notifications =
                JSON.parse(data);


            const filtered =
                notifications.filter(
                    notification =>
                        String(
                            notification.id
                        ) !==
                        id
                );


            fs.writeFileSync(

                notificationsFile,

                JSON.stringify(
                    filtered,
                    null,
                    4
                ),

                "utf8"

            );


            res.json({

                success:
                    true

            });


        } catch (error) {

            console.error(
                "Notification delete error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't delete notification."

            });

        }

    }
);


/* =========================================
   STUDENT OF THE WEEK
========================================= */

const studentOfWeekFile =
    path.join(
        __dirname,
        "studentOfWeek.json"
    );


if (!fs.existsSync(studentOfWeekFile)) {

    fs.writeFileSync(

        studentOfWeekFile,

        JSON.stringify(

            {

                student:
                    "",

                title:
                    "",

                reason:
                    "",

                updatedAt:
                    null

            },

            null,

            4

        ),

        "utf8"

    );

}


/* =========================================
   GET STUDENT OF THE WEEK
========================================= */

app.get(
    "/api/student-of-week",
    (req, res) => {

        try {

            const data =
                fs.readFileSync(
                    studentOfWeekFile,
                    "utf8"
                );


            const studentOfWeek =
                JSON.parse(data);


            res.json(
                studentOfWeek
            );


        } catch (error) {

            console.error(
                "Student of the week load error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't load Student of the Week."

            });

        }

    }
);


/* =========================================
   SAVE STUDENT OF THE WEEK
========================================= */

app.post(
    "/api/student-of-week",
    (req, res) => {

        try {

            const student =
                String(
                    req.body.student ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    80
                );


            const title =
                String(
                    req.body.title ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    100
                );


            const reason =
                String(
                    req.body.reason ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    300
                );


            if (
                !student ||
                !title ||
                !reason
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Student, title and reason are required."

                });

            }


            const leaderboardData =
                fs.readFileSync(
                    leaderboardFile,
                    "utf8"
                );


            const leaderboard =
                JSON.parse(
                    leaderboardData
                );


            const studentExists =
                leaderboard.some(
                    entry =>
                        String(
                            entry.name || ""
                        )
                        .trim()
                        .toLowerCase() ===
                        student.toLowerCase()
                );


            if (!studentExists) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "That student is not in the class leaderboard."

                });

            }


            const result = {

                student:
                    student,

                title:
                    title,

                reason:
                    reason,

                updatedAt:
                    new Date().toISOString()

            };


            fs.writeFileSync(

                studentOfWeekFile,

                JSON.stringify(
                    result,
                    null,
                    4
                ),

                "utf8"

            );


            const notificationsData =
                fs.readFileSync(
                    notificationsFile,
                    "utf8"
                );


            const notifications =
                JSON.parse(
                    notificationsData
                );


            notifications.push({

                id:
                    Date.now().toString(),

                title:
                    "Student of the Week",

                message:
                    `${student} has been selected as Student of the Week!`,

                type:
                    "info",

                createdAt:
                    new Date().toISOString()

            });


            fs.writeFileSync(

                notificationsFile,

                JSON.stringify(
                    notifications.slice(-100),
                    null,
                    4
                ),

                "utf8"

            );


            console.log(
                `⭐ Student of the Week: ${student}`
            );


            res.json({

                success:
                    true,

                studentOfWeek:
                    result

            });


        } catch (error) {

            console.error(
                "Student of the week save error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't save Student of the Week."

            });

        }

    }
);


/* =========================================
   SHOUTBOX SYSTEM
========================================= */

const shoutboxFile =
    path.join(
        __dirname,
        "shoutbox.json"
    );


if (!fs.existsSync(shoutboxFile)) {

    fs.writeFileSync(
        shoutboxFile,
        "[]",
        "utf8"
    );

}


/* =========================================
   GET SHOUTBOX
========================================= */

app.get(
    "/api/shoutbox",
    (req, res) => {

        try {

            const data =
                fs.readFileSync(
                    shoutboxFile,
                    "utf8"
                );


            const messages =
                JSON.parse(data);


            messages.sort(
                (a, b) =>
                    new Date(
                        a.createdAt
                    ) -
                    new Date(
                        b.createdAt
                    )
            );


            res.json(
                messages
            );


        } catch (error) {

            console.error(
                "Shoutbox load error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't load shoutbox."

            });

        }

    }
);


/* =========================================
   POST SHOUTBOX MESSAGE
========================================= */

app.post(
    "/api/shoutbox",
    (req, res) => {

        try {

            const name =
                String(
                    req.body.name ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    80
                );


            const message =
                String(
                    req.body.message ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    300
                );


            if (
                !name ||
                !message
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Name and message are required."

                });

            }


            const data =
                fs.readFileSync(
                    shoutboxFile,
                    "utf8"
                );


            const messages =
                JSON.parse(
                    data
                );


            const newMessage = {

                id:
                    Date.now().toString() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(
                            2,
                            8
                        ),

                name:
                    name,

                message:
                    message,

                createdAt:
                    new Date().toISOString()

            };


            messages.push(
                newMessage
            );


            fs.writeFileSync(

                shoutboxFile,

                JSON.stringify(
                    messages.slice(-200),
                    null,
                    4
                ),

                "utf8"

            );


            console.log(
                `💬 Shoutbox message from ${name}`
            );


            res.json({

                success:
                    true,

                message:
                    newMessage

            });


        } catch (error) {

            console.error(
                "Shoutbox save error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't send message."

            });

        }

    }
);


/* =========================================
   DELETE SHOUTBOX MESSAGE
========================================= */

app.delete(
    "/api/shoutbox/:id",
    (req, res) => {

        try {

            const id =
                String(
                    req.params.id
                );


            const data =
                fs.readFileSync(
                    shoutboxFile,
                    "utf8"
                );


            const messages =
                JSON.parse(data);


            const filtered =
                messages.filter(
                    item =>
                        String(
                            item.id
                        ) !==
                        id
                );


            fs.writeFileSync(

                shoutboxFile,

                JSON.stringify(
                    filtered,
                    null,
                    4
                ),

                "utf8"

            );


            res.json({

                success:
                    true

            });


        } catch (error) {

            console.error(
                "Shoutbox delete error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't delete message."

            });

        }

    }
);


/* =========================================
   ANNOUNCEMENTS SYSTEM
========================================= */

const announcementsFile =
    path.join(
        __dirname,
        "announcements.json"
    );


if (!fs.existsSync(announcementsFile)) {

    fs.writeFileSync(
        announcementsFile,
        "[]",
        "utf8"
    );

}


/* =========================================
   GET ANNOUNCEMENTS
========================================= */

app.get(
    "/api/announcements",
    (req, res) => {

        try {

            const data =
                fs.readFileSync(
                    announcementsFile,
                    "utf8"
                );


            const announcements =
                JSON.parse(
                    data
                );


            announcements.sort(
                (a, b) =>
                    new Date(
                        b.createdAt
                    ) -
                    new Date(
                        a.createdAt
                    )
            );


            res.json(
                announcements
            );


        } catch (error) {

            console.error(
                "Announcement load error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't load announcements."

            });

        }

    }
);


/* =========================================
   CREATE ANNOUNCEMENT
========================================= */

app.post(
    "/api/announcements",
    (req, res) => {

        try {

            const title =
                String(
                    req.body.title ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    100
                );


            const message =
                String(
                    req.body.message ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    500
                );


            const type =
                String(
                    req.body.type ||
                    "info"
                )
                .trim()
                .slice(
                    0,
                    30
                );


            const dueDate =
                String(
                    req.body.dueDate ||
                    ""
                )
                .trim()
                .slice(
                    0,
                    20
                );


            if (
                !title ||
                !message
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Title and message are required."

                });

            }


            const data =
                fs.readFileSync(
                    announcementsFile,
                    "utf8"
                );


            const announcements =
                JSON.parse(
                    data
                );


            const announcement = {

                id:
                    Date.now().toString(),

                title:
                    title,

                message:
                    message,

                type:
                    type,

                dueDate:
                    dueDate,

                createdAt:
                    new Date().toISOString()

            };


            announcements.push(
                announcement
            );


            fs.writeFileSync(

                announcementsFile,

                JSON.stringify(
                    announcements.slice(-100),
                    null,
                    4
                ),

                "utf8"

            );


            const notificationsData =
                fs.readFileSync(
                    notificationsFile,
                    "utf8"
                );


            const notifications =
                JSON.parse(
                    notificationsData
                );


            notifications.push({

                id:
                    Date.now().toString() +
                    "-announcement",

                title:
                    title,

                message:
                    message,

                type:
                    "event",

                createdAt:
                    new Date().toISOString()

            });


            fs.writeFileSync(

                notificationsFile,

                JSON.stringify(
                    notifications.slice(-100),
                    null,
                    4
                ),

                "utf8"

            );


            console.log(
                `📅 New announcement: ${title}`
            );


            res.json({

                success:
                    true,

                announcement:
                    announcement

            });


        } catch (error) {

            console.error(
                "Announcement save error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't create announcement."

            });

        }

    }
);


/* =========================================
   DELETE ANNOUNCEMENT
========================================= */

app.delete(
    "/api/announcements/:id",
    (req, res) => {

        try {

            const id =
                String(
                    req.params.id
                );


            const data =
                fs.readFileSync(
                    announcementsFile,
                    "utf8"
                );


            const announcements =
                JSON.parse(
                    data
                );


            const filtered =
                announcements.filter(
                    announcement =>
                        String(
                            announcement.id
                        ) !==
                        id
                );


            fs.writeFileSync(

                announcementsFile,

                JSON.stringify(
                    filtered,
                    null,
                    4
                ),

                "utf8"

            );


            res.json({

                success:
                    true

            });


        } catch (error) {

            console.error(
                "Announcement delete error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Couldn't delete announcement."

            });

        }

    }
);


/* =========================================
   CHESS MATCHMAKING + ONLINE GAME SYSTEM
========================================= */

let chessQueue = [];

const chessMatches =
    new Map();


/* =========================================
   CREATE MATCH
========================================= */

function createChessMatch(
    playerA,
    playerB,
    swapColors = false
) {

    const matchId =
        Date.now().toString() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 8);


    const chessGame =
        new Chess();


    const colors =
        swapColors

            ? {
                [playerA]: "black",
                [playerB]: "white"
            }

            : {
                [playerA]: "white",
                [playerB]: "black"
            };


    const match = {

        matchId:

            matchId,


        players: [

            playerA,

            playerB

        ],


        colors:


            colors,


        game:

            chessGame,


        lastMove:

            null,


        resignedBy:

            null,


        createdAt:

            Date.now(),


        rematchRequest:

            null,


        rematchResponse:

            null,


        rematchMatchId:

            null

    };


    chessMatches.set(
        matchId,
        match
    );


    return match;

}


/* =========================================
   FIND ACTIVE MATCH
========================================= */

function findChessActiveMatch(
    name
) {

    const normalizedName =
        String(
            name || ""
        )
        .trim()
        .toLowerCase();


    if (
        !normalizedName
    ) {

        return null;

    }


    for (
        const match
        of chessMatches.values()
    ) {

        if (
            !match.game ||
            match.resignedBy
        ) {

            continue;

        }


        if (
            match.game.isGameOver()
        ) {

            continue;

        }


        const belongsToMatch =
            match.players.some(
                player =>
                    player
                        .toLowerCase() ===
                    normalizedName
            );


        if (
            belongsToMatch
        ) {

            return match;

        }

    }


    return null;

}


/* =========================================
   FIND ANY MATCH
========================================= */

function findChessMatch(
    name
) {

    const normalizedName =
        String(
            name || ""
        )
        .trim()
        .toLowerCase();


    if (
        !normalizedName
    ) {

        return null;

    }


    for (
        const match
        of chessMatches.values()
    ) {

        const belongsToMatch =
            match.players.some(
                player =>
                    player
                        .toLowerCase() ===
                    normalizedName
            );


        if (
            belongsToMatch
        ) {

            return match;

        }

    }


    return null;

}


/* =========================================
   CLEAN OLD CHESS DATA
========================================= */

function cleanChessData() {

    const now =
        Date.now();


    /*
     * Waiting players expire after 10 minutes.
     */

    chessQueue =
        chessQueue.filter(
            player =>
                now -
                player.joinedAt <
                10 * 60 * 1000
        );


    /*
     * Matches expire after 2 hours.
     */

    for (
        const [
            matchId,
            match
        ]
        of chessMatches
    ) {

        if (
            now -
            match.createdAt >
            2 * 60 * 60 * 1000
        ) {

            chessMatches.delete(
                matchId
            );

        }

    }

}


/* =========================================
   MATCH STATE FOR PLAYER
========================================= */

function getChessMatchState(
    match,
    playerName
) {

    const normalizedName =
        String(
            playerName || ""
        )
        .trim()
        .toLowerCase();


    const playerIndex =
        match.players.findIndex(
            player =>
                player
                    .toLowerCase() ===
                normalizedName
        );


    if (
        playerIndex === -1
    ) {

        return null;

    }


    const player =
        match.players[
            playerIndex
        ];


    const opponent =
        match.players[
            playerIndex === 0
                ? 1
                : 0
        ];


    return {

        success:
            true,


        matched:
            true,


        matchId:
            match.matchId,


        player:
            player,


        opponent:
            opponent,


        color:
            match.colors[
                player
            ],


        opponentColor:
            match.colors[
                opponent
            ],


        fen:
            match.game.fen(),


        turn:
            match.game.turn(),


        isGameOver:
            match.game.isGameOver(),


        isCheck:
            match.game.inCheck(),


        isCheckmate:
            match.game.isCheckmate(),


        isStalemate:
            match.game.isStalemate(),


        isDraw:
            match.game.isDraw(),


        resignedBy:
            match.resignedBy ||
            null,


        lastMove:
            match.lastMove ||
            null

    };

}


/* =========================================
   QUEUE STATUS
========================================= */

app.get(
    "/api/chess/queue",
    (req, res) => {

        try {

            cleanChessData();


            res.json({

                success:
                    true,


                waiting:
                    chessQueue.length

            });


        } catch (error) {

            console.error(
                "Chess queue status error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't read chess queue."

            });

        }

    }
);


/* =========================================
   PLAYER MATCH / QUEUE STATUS
========================================= */

app.get(
    "/api/chess/queue/status",
    (req, res) => {

        try {

            cleanChessData();


            const name =
                String(
                    req.query.name || ""
                )
                .trim();


            if (
                !name
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "Name is required."

                });

            }


            /*
             * ONLY return an active match.
             *
             * Finished games must NOT
             * automatically count as matches.
             */

            const activeMatch =
                findChessActiveMatch(
                    name
                );


            if (
                !activeMatch
            ) {

                const waiting =
                    chessQueue.some(
                        player =>
                            player.name
                                .toLowerCase() ===
                            name.toLowerCase()
                    );


                return res.json({

                    success:
                        true,


                    matched:
                        false,


                    waiting:
                        waiting

                });

            }


            const state =
                getChessMatchState(
                    activeMatch,
                    name
                );


            if (
                !state
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,


                    message:
                        "You are not part of this match."

                });

            }


            res.json(
                state
            );


        } catch (error) {

            console.error(
                "Chess match status error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't check match status."

            });

        }

    }
);


/* =========================================
   JOIN NORMAL QUEUE
========================================= */

app.post(
    "/api/chess/queue/join",
    (req, res) => {

        try {

            cleanChessData();


            const name =
                String(
                    req.body.name || ""
                )
                .trim()
                .slice(0, 80);


            const avoidOpponent =
                String(
                    req.body.avoidOpponent ||
                    ""
                )
                .trim()
                .toLowerCase();


            if (
                !name
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "Your name is required."

                });

            }


            const normalizedName =
                name.toLowerCase();


            /*
             * Already in an active game?
             * Return that game.
             */

            const existingMatch =
                findChessActiveMatch(
                    name
                );


            if (
                existingMatch
            ) {

                return res.json(
                    getChessMatchState(
                        existingMatch,
                        name
                    )
                );

            }


            /*
             * Remove stale duplicate queue entry.
             */

            chessQueue =
                chessQueue.filter(
                    player =>
                        player.name
                            .toLowerCase() !==
                        normalizedName
                );


            /*
             * Find a waiting opponent.
             *
             * IMPORTANT:
             * avoidOpponent is honored.
             */

            const opponentIndex =
                chessQueue.findIndex(
                    player => {

                        const otherName =
                            player.name
                                .toLowerCase();


                        if (
                            otherName ===
                            normalizedName
                        ) {

                            return false;

                        }


                        if (
                            avoidOpponent &&
                            otherName ===
                            avoidOpponent
                        ) {

                            return false;

                        }


                        return true;

                    }
                );


            /*
             * Someone is waiting.
             */

            if (
                opponentIndex !== -1
            ) {

                const opponent =
                    chessQueue.splice(
                        opponentIndex,
                        1
                    )[0];


                const match =
                    createChessMatch(
                        opponent.name,
                        name,
                        false
                    );


                console.log(
                    `♟ ONLINE CHESS MATCH: ${opponent.name} vs ${name}`
                );


                return res.json(
                    getChessMatchState(
                        match,
                        name
                    )
                );

            }


            /*
             * Nobody available.
             */

            chessQueue.push({

                name:
                    name,


                joinedAt:
                    Date.now(),


                avoidOpponent:
                    avoidOpponent ||
                    null

            });


            return res.json({

                success:
                    true,


                matched:
                    false,


                waiting:
                    true

            });


        } catch (error) {

            console.error(
                "Chess queue join error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't join chess queue."

            });

        }

    }
);


/* =========================================
   LEAVE QUEUE
========================================= */

app.post(
    "/api/chess/queue/leave",
    (req, res) => {

        try {

            cleanChessData();


            const name =
                String(
                    req.body.name || ""
                )
                .trim()
                .toLowerCase();


            chessQueue =
                chessQueue.filter(
                    player =>
                        player.name
                            .toLowerCase() !==
                        name
                );


            res.json({

                success:
                    true,


                waiting:
                    chessQueue.length

            });


        } catch (error) {

            console.error(
                "Chess queue leave error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't leave chess queue."

            });

        }

    }
);


/* =========================================
   GET MATCH STATE
========================================= */

app.get(
    "/api/chess/match/:matchId",
    (req, res) => {

        try {

            cleanChessData();


            const match =
                chessMatches.get(
                    req.params.matchId
                );


            if (
                !match
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,


                    message:
                        "Match not found."

                });

            }


            const playerName =
                String(
                    req.query.name || ""
                )
                .trim();


            const state =
                getChessMatchState(
                    match,
                    playerName
                );


            if (
                !state
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,


                    message:
                        "You are not part of this match."

                });

            }


            res.json(
                state
            );


        } catch (error) {

            console.error(
                "Chess game state error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't load chess game."

            });

        }

    }
);


/* =========================================
   MAKE CHESS MOVE
========================================= */

app.post(
    "/api/chess/match/:matchId/move",
    (req, res) => {

        try {

            cleanChessData();


            const match =
                chessMatches.get(
                    req.params.matchId
                );


            if (
                !match
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,


                    message:
                        "Match not found."

                });

            }


            const playerName =
                String(
                    req.body.name || ""
                )
                .trim();


            const from =
                String(
                    req.body.from || ""
                )
                .trim()
                .toLowerCase();


            const to =
                String(
                    req.body.to || ""
                )
                .trim()
                .toLowerCase();


            const promotion =
                String(
                    req.body.promotion ||
                    "q"
                )
                .trim()
                .toLowerCase();


            const player =
                match.players.find(
                    name =>
                        name
                            .toLowerCase() ===
                        playerName.toLowerCase()
                );


            if (
                !player
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,


                    message:
                        "You are not part of this match."

                });

            }


            if (
                match.resignedBy
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "This match has ended."

                });

            }


            if (
                match.game.isGameOver()
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "This game is already over."

                });

            }


            const playerColor =
                match.colors[
                    player
                ];


            const currentTurn =
                match.game.turn() === "w"
                    ? "white"
                    : "black";


            if (
                playerColor !==
                currentTurn
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "It is not your turn."

                });

            }


            const legalMoves =
                match.game.moves({

                    square:
                        from,


                    verbose:
                        true

                });


            const legalMove =
                legalMoves.find(
                    move =>
                        move.to ===
                        to
                );


            if (
                !legalMove
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "Illegal chess move."

                });

            }


            const move =
                match.game.move({

                    from:
                        from,


                    to:
                        to,


                    promotion:

                        (
                            promotion === "r" ||
                            promotion === "b" ||
                            promotion === "n"
                        )

                            ? promotion

                            : "q"

                });


            match.lastMove = {

                from:
                    move.from,


                to:
                    move.to,


                promotion:
                    move.promotion ||
                    null,


                player:
                    player,


                createdAt:
                    Date.now()

            };


            console.log(
                `♟ MOVE ${match.matchId}: ${player} ${move.from}-${move.to}`
            );


            res.json(
                getChessMatchState(
                    match,
                    player
                )
            );


        } catch (error) {

            console.error(
                "Chess move error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't make chess move."

            });

        }

    }
);


/* =========================================
   RESIGN
========================================= */

app.post(
    "/api/chess/match/:matchId/resign",
    (req, res) => {

        try {

            const match =
                chessMatches.get(
                    req.params.matchId
                );


            if (
                !match
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,


                    message:
                        "Match not found."

                });

            }


            const name =
                String(
                    req.body.name || ""
                )
                .trim();


            const player =
                match.players.find(
                    item =>
                        item
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (
                !player
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,


                    message:
                        "You are not part of this match."

                });

            }


            if (
                match.resignedBy ||
                match.game.isGameOver()
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "This game has already ended."

                });

            }


            match.resignedBy =
                player;


            console.log(
                `🏳 CHESS RESIGN: ${player} resigned from ${match.matchId}`
            );


            res.json({

                success:
                    true,


                resigned:
                    player

            });


        } catch (error) {

            console.error(
                "Chess resignation error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't resign."

            });

        }

    }
);


/* =========================================
   REMATCH REQUEST
========================================= */

app.post(
    "/api/chess/match/:matchId/rematch/request",
    (req, res) => {

        try {

            cleanChessData();


            const match =
                chessMatches.get(
                    req.params.matchId
                );


            if (
                !match
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,


                    message:
                        "Match not found."

                });

            }


            const name =
                String(
                    req.body.name || ""
                )
                .trim();


            const player =
                match.players.find(
                    item =>
                        item
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (
                !player
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,


                    message:
                        "You are not part of this match."

                });

            }


            /*
             * Rematch only after the old
             * game is finished.
             */

            const gameEnded =
                match.game.isGameOver() ||
                Boolean(
                    match.resignedBy
                );


            if (
                !gameEnded
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "The game is still active."

                });

            }


            /*
             * Already accepted / created?
             */

            if (
                match.rematchMatchId
            ) {

                return res.json({

                    success:
                        true,


                    ready:
                        true,


                    rematchMatchId:
                        match.rematchMatchId

                });

            }


            /*
             * Don't let someone send a
             * second request.
             */

            if (
                match.rematchRequest
            ) {

                const requester =
                    match.rematchRequest
                        .requester
                        .toLowerCase();


                if (
                    requester ===
                    player.toLowerCase()
                ) {

                    return res.json({

                        success:
                            true,


                        waiting:
                            true,


                        requestedByMe:
                            true

                    });

                }


                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        `${match.rematchRequest.requester} already requested a rematch.`

                });

            }


            match.rematchRequest = {

                requester:
                    player,


                createdAt:
                    Date.now()

            };


            match.rematchResponse =
                null;


            console.log(
                `↻ REMATCH REQUEST: ${player} -> ${match.players.find(item => item !== player)}`
            );


            res.json({

                success:
                    true,


                waiting:
                    true,


                requestedByMe:
                    true

            });


        } catch (error) {

            console.error(
                "Rematch request error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't request rematch."

            });

        }

    }
);


/* =========================================
   REMATCH STATUS
========================================= */

app.get(
    "/api/chess/match/:matchId/rematch/status",
    (req, res) => {

        try {

            const match =
                chessMatches.get(
                    req.params.matchId
                );


            if (
                !match
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,


                    message:
                        "Match not found."

                });

            }


            const name =
                String(
                    req.query.name || ""
                )
                .trim();


            const player =
                match.players.find(
                    item =>
                        item
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (
                !player
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,


                    message:
                        "You are not part of this match."

                });

            }


            /*
             * Rematch already accepted.
             */

            if (
                match.rematchMatchId
            ) {

                return res.json({

                    success:
                        true,


                    ready:
                        true,


                    matchId:
                        match.rematchMatchId

                });

            }


            /*
             * Opponent refused.
             */

            if (
                match.rematchResponse ===
                "refused"
            ) {

                match.rematchResponse =
                    null;


                return res.json({

                    success:
                        true,


                    refused:
                        true

                });

            }


            const request =
                match.rematchRequest;


            if (
                !request
            ) {

                return res.json({

                    success:
                        true,


                    incomingRequest:
                        false,


                    requestedByMe:
                        false,


                    waiting:
                        false

                });

            }


            const requestedByMe =
                request.requester
                    .toLowerCase() ===
                player
                    .toLowerCase();


            return res.json({

                success:
                    true,


                incomingRequest:
                    !requestedByMe,


                requestedByMe:
                    requestedByMe,


                requester:
                    request.requester,


                waiting:
                    requestedByMe

            });


        } catch (error) {

            console.error(
                "Rematch status error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't check rematch status."

            });

        }

    }
);


/* =========================================
   ACCEPT / REFUSE REMATCH
========================================= */

app.post(
    "/api/chess/match/:matchId/rematch/respond",
    (req, res) => {

        try {

            cleanChessData();


            const match =
                chessMatches.get(
                    req.params.matchId
                );


            if (
                !match
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,


                    message:
                        "Match not found."

                });

            }


            const name =
                String(
                    req.body.name || ""
                )
                .trim();


            const action =
                String(
                    req.body.action || ""
                )
                .trim()
                .toLowerCase();


            const player =
                match.players.find(
                    item =>
                        item
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (
                !player
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,


                    message:
                        "You are not part of this match."

                });

            }


            const request =
                match.rematchRequest;


            if (
                !request
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "There is no pending rematch request."

                });

            }


            if (
                request.requester
                    .toLowerCase() ===
                player
                    .toLowerCase()
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "You cannot answer your own rematch request."

                });

            }


            /*
             * REFUSE
             */

            if (
                action ===
                "refuse"
            ) {

                match.rematchRequest =
                    null;


                match.rematchResponse =
                    "refused";


                console.log(
                    `✕ REMATCH REFUSED by ${player}`
                );


                return res.json({

                    success:
                        true,


                    refused:
                        true

                });

            }


            /*
             * ACCEPT
             */

            if (
                action !==
                "accept"
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "Invalid rematch action."

                });

            }


            const requester =
                request.requester;


            /*
             * Swap colors in the rematch.
             */

            const newMatch =
                createChessMatch(
                    requester,
                    player,
                    true
                );


            match.rematchMatchId =
                newMatch.matchId;


            match.rematchRequest =
                null;


            match.rematchResponse =
                "accepted";


            console.log(
                `↻ CHESS REMATCH STARTED: ${requester} vs ${player}`
            );


            return res.json({

                success:
                    true,


                accepted:
                    true,


                rematchMatchId:
                    newMatch.matchId

            });


        } catch (error) {

            console.error(
                "Rematch response error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't process rematch response."

            });

        }

    }
);


/* =========================================
   PLAY AGAIN
   FIND A DIFFERENT OPPONENT
========================================= */

app.post(
    "/api/chess/play-again",
    (req, res) => {

        try {

            cleanChessData();


            const name =
                String(
                    req.body.name || ""
                )
                .trim()
                .slice(0, 80);


            const avoidOpponent =
                String(
                    req.body.avoidOpponent || ""
                )
                .trim()
                .toLowerCase();


            if (
                !name
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    message:
                        "Your name is required."

                });

            }


            const normalizedName =
                name.toLowerCase();


            /*
             * Remove the current player from
             * any existing queue entry.
             */

            chessQueue =
                chessQueue.filter(
                    player =>
                        player.name
                            .toLowerCase() !==
                        normalizedName
                );


            /*
             * IMPORTANT:
             *
             * Find someone waiting who is NOT
             * the previous opponent.
             */

            const opponentIndex =
                chessQueue.findIndex(
                    player => {

                        const otherName =
                            player.name
                                .toLowerCase();


                        if (
                            otherName ===
                            normalizedName
                        ) {

                            return false;

                        }


                        if (
                            avoidOpponent &&
                            otherName ===
                            avoidOpponent
                        ) {

                            return false;

                        }


                        return true;

                    }
                );


            /*
             * Found somebody new.
             */

            if (
                opponentIndex !== -1
            ) {

                const opponent =
                    chessQueue.splice(
                        opponentIndex,
                        1
                    )[0];


                const match =
                    createChessMatch(
                        opponent.name,
                        name,
                        false
                    );


                console.log(
                    `⚡ PLAY AGAIN: ${opponent.name} vs ${name}`
                );


                return res.json(
                    getChessMatchState(
                        match,
                        name
                    )
                );

            }


            /*
             * Nobody new is available.
             * Stay in the queue.
             */

            chessQueue.push({

                name:
                    name,


                joinedAt:
                    Date.now(),


                avoidOpponent:
                    avoidOpponent ||
                    null

            });


            return res.json({

                success:
                    true,


                matched:
                    false,


                waiting:
                    true

            });


        } catch (error) {

            console.error(
                "Play again error:",
                error
            );


            res.status(500).json({

                success:
                    false,


                message:
                    "Couldn't start matchmaking."

            });

        }

    }
);

/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "⚡ 4MS3 SERVER IS RUNNING"
        );

        console.log("");

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log("");

        console.log(
            "📥 Pending photos:",
            pendingFolder
        );

        console.log(
            "✅ Approved photos:",
            approvedFolder
        );

        console.log("");

    }
);