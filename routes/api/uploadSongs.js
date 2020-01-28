const express = require('express');
const Song = require('../../models/Song');
const router = express.Router();
const multer = require('multer');

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
router.get('/showSongs', async (req, res) => {

    console.log('get all songs')
    try {
        const songs = await Song.find();
        res.json(songs);
    } catch (e) {
        res.json({message: e});
    }
});

router.get('/showSong/:id', async (req, res) => {

    console.log('single song');
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({message: 'Song not found'})
        }

        song.views +=1;
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



        song.songName= req.body.songName,
        song.singer= req.body.singer,

        song.category= req.body.category,

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

        await  song.remove();
        res.json({ message: 'Song is deleted successfully'});
    } catch (e) {
        console.log(e);

        if (e.kind === 'ObjectId') {
            return res.status(404).json({message: 'Song not found'})
        }

        res.status(500).send('sever error on removing single song')
    }
});

var cpUpload = upload.fields([{name: "songURL", maxCount: 1}, {name: "imageURL", maxCount: 1}])
router.post("/addSong", cpUpload, (req, res, next) => {

    console.log(req.files)
    console.log('domdom')



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