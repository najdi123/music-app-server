const express = require('express');
const Song = require('../../models/Song');
const User = require('../../models/User');
const router = express.Router();
const multer = require('multer');
const verifyAuth = require('../../verifyToken');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './')
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname)
    }
});

const fileFilter = (req, file, callback) => {
    console.log(file.mimetype)
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
        callback(null, true);
    }
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        callback(null, true);
    } else {
        callback(new Error('Only audio files are allowed. '), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 15
    },
    // fileFilter: fileFilter
});

// get all song
router.get('/showSongs', async (req, res) => {

    console.log('get all songs')
    try {
        const songs = await Song.find();
        res.json(songs);
    } catch (e) {
        res.json({message: e});
    }
});

// get a single song by id
router.get('/showSong/:id', async (req, res) => {

    console.log('single song');
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({message: 'Song not found'})
        }

        song.views += 1;
        song.save(function (err, song) {
            if (err) return console.error(err);
            // console.log(song.views + " saved to collection.");
        });


        res.json(song);
    } catch (e) {
        console.log(e);

        if (e.kind === 'ObjectId') {
            return res.status(404).json({message: 'Song not found'})
        }

        res.status(500).send('sever error on getting single song')
    }
});

// Edit single song
router.put('/editSong/:id', upload.none(), async (req, res) => {
    console.log(req.body)
    console.log('single song edited');
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({message: 'Song not found'})
        }


        song.songName = req.body.songName,
            song.singer = req.body.singer,

            song.category = req.body.category,

            song.views = req.body.views;


        song.save(function (err, song) {
            if (err) return console.error(err);
            // console.log(song.views + " saved to collection.");
        });


        res.json(song);
    } catch (e) {
        console.log(e);

        if (e.kind === 'ObjectId') {
            return res.status(404).json({message: 'Song not found'})
        }

        res.status(500).send('sever error on getting single song')
    }
});

// get by category
router.get('/showSongs/:category', async (req, res) => {

    console.log('get by category');
    console.log(req.query.category);
    try {
        const songs = await Song.find({category: req.query.category});

        console.log(songs);

        if (!songs) {
            return res.status(404).json({message: 'No Song was found'})
        }

        res.json(songs);
    } catch (e) {
        console.log(e);

        if (e.kind === 'ObjectId') {
            return res.status(404).json({message: 'Song not found'})
        }

        res.status(500).send('sever error on getting single song')
    }
});

// get by singer
router.get('/showSongsBySinger/:singer', async (req, res) => {

    console.log('get by singer');
    console.log(req.query);
    try {
        const songs = await Song.find({singer: req.query.singer});

        console.log(songs);

        if (!songs) {
            return res.status(404).json({message: 'No Song was found'})
        }

        res.json(songs);
    } catch (e) {
        console.log(e);

        if (e.kind === 'ObjectId') {
            return res.status(404).json({message: 'Song not found'})
        }

        res.status(500).send('sever error on getting songs by singer')
    }
});

router.delete('/showSong/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        await song.remove();
        res.json({message: 'Song is deleted successfully'});
    } catch (e) {
        console.log(e);

        if (e.kind === 'ObjectId') {
            return res.status(404).json({message: 'Song not found'})
        }

        res.status(500).send('sever error on removing single song')
    }
});

// like a song
router.put('/like/:id', verifyAuth, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (song.likes.filter(like => like.user.toString() === req.user._id).length > 0) {
            return res.status(200).json({message: 'Song already liked'});
        }

        song.likes.unshift({user: req.user._id});

        await song.save();

        res.json(song.likes)

    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error on like');
    }
});

// unlike a previously liked song
router.put('/unlike/:id', verifyAuth, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (song.likes.filter(like => like.user.toString() === req.user._id).length === 0) {
            return res.status(400).json({message: 'Song has not been liked yet'});
            console.log('Song not liked')
        }

        const removeIndex = song.likes
            .map(like => like.user.toString())
            .indexOf(req.user._id);
        song.likes.splice(removeIndex, 1);

        await song.save();

        res.json(song.likes)

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error on unlike');
    }
});

router.get('/comments/:id', async (req, res) => {

    console.log('get songs comments');
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({message: 'Song not found for comments'})
        }

        const comments = song.comments;
        if (!comments) {
            return res.status(404).json({message: 'Comments not found for song'})
        }
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error on get comments');
    }
});

// route:    POST /api/comment/:id
// @desc     Comment on a song
// @access   Private
router.post('/comment/:id', verifyAuth, async (req, res) => {
        try {
            const user = await User.findById(req.user._id);
            const song = await Song.findById(req.params.id);

            const newComment = {
                text: req.body.text,
                name: user.email,
                user: req.user._id
            };

            song.comments.unshift(newComment);

            await song.save();

            res.json(song.comments);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error on comment');
        }
    }
);

// route:    DELETE /api/comment/:id/:comment_id
// @desc     delete Comment on a song
// @access   Private

//verifyAuth,
router.delete('/delete-comment/:id/:comment_id',verifyAuth,  async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({message: 'song does not exist'})
        }

        // console.log(req.params)
        // pull the intended comment
        const comment = song.comments.find(comment => comment.id === req.params.comment_id);

        if (!comment) {
            return res.status(404).json({message: 'comment does not exist'})
        }
        // console.log(req.user)
        // check user
        if (comment.user.toString() !== req.user._id) {
            return res.status(401).json({message: 'User not authorized'})
        }

        const removeIndex = song.comments
            .map(comment => comment.id)
            .indexOf(req.params.comment_id);
        song.comments.splice(removeIndex, 1);

        await song.save();

        res.json(song.comments)

    } catch (e) {
        console.error(e.message);
        res.status(500).send('Server Error on delete comment');
    }
})

var cpUpload = upload.fields([{name: "songURL", maxCount: 1}, {name: "imageURL", maxCount: 1}])
router.post("/addSong", cpUpload, (req, res, next) => {

    console.log(req.files)
    // console.log('domdom')


    if (req.files.imageURL[0].fieldname === 'imageURL') {
        if (req.files.imageURL[0].mimetype === 'image/jpeg' || req.files.imageURL[0].mimetype === 'image/png') {
            //send a success message to front that the file is ok
            console.log('image format is ok')
        } else {
            console.log('image format is invalid')
        }
    }

    if (req.files.songURL[0].fieldname === 'songURL') {
        if (req.files.songURL[0].mimetype === 'audio/mpeg' || req.files.songURL[0].mimetype === 'audio/mp3') {
            console.log('song format is ok')
        } else {
            console.log('song format is invalid')
        }
    }

    var array = req.files.songURL[0].path.split(".");
    const fileFormat = '.' + array[array.length - 1];

    const songPath = 'upload/songs/' + Date.now() + fileFormat;

    const fs = require('fs');
    fs.rename(req.files.songURL[0].path, songPath, function (err) {

        if (err) throw err;
        //console.log('File Renamed.');
        console.log('Song renamed and relocated');
    });

    var arrayP = req.files.imageURL[0].path.split(".");
    const imageFormat = '.' + arrayP[array.length - 1];
    const imagePath = 'upload/images/' + Date.now() + imageFormat;
    fs.rename(req.files.imageURL[0].path, imagePath, function (err) {

        if (err) throw err;
        //console.log('File Renamed.');
        console.log('image renamed and relocated');
    });


    const song = new Song({
        songName: req.body.songName,
        singer: req.body.singer,
        songURL: songPath,
        imageURL: imagePath,
        category: req.body.category
    });

    song.save().then(result => {
        res.status(201).json({
            message: "Song uploaded successfully!"
        });

    });
});

module.exports = router;