const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const upload = require('express-fileupload')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

var errors = ''


//init app
const app = express()
app.set('view engine','pug')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(upload())
app.use("/files", express.static(path.join(__dirname, 'files')));


//bring in models
let Post = require('./models/post')
let Set = require('./models/set')

// Home page
app.get('/', (req, res) => {
    let query = Set.find({}).sort({$natural:-1})
    query.exec(function(err, postsres){
        if(err){
            console.log(err)
        } else {
            res.render('index',{
                posts: postsres
            })
        }
    })
})

// Set page
app.get('/sets/:id', function(req, res){
    Set.findById(req.params.id, (err, set) => {
        let query = Post.find({ whichSet : req.params.id }).sort({$natural:-1})
        query.exec( (err, postres) => {
            res.render('set-info', {
                set: set,
                posts: postres
            })
        })
    })
})

// ---------------------------------------- //
// Adding a new Set
app.get('/add-set', (req, res) => {
    res.render('add-set')
})

app.post('/add-set', (req, res) => {
    let set = new Set()
    set.title = req.body.body
    
    set.save(function(err){ //to add to db
        if(err) {
            console.log(err)
            return
        } else {
            res.redirect('/')
        }
    })
})
// ---------------------------------------- //

// Add a new piece from the Set-info page
app.post('/add-piece/:id/:setname', (req, res) => {
    
    let post = new Post()
    post.title = req.body.body
    post.number = req.body.no
    post.whichSet = req.params.id
    post.setName = req.params.setname

    if(req.files) {
        var x = Math.floor((Math.random() * 1000) + 1);
        // create this file
        req.files.file.mv('./files/'+x+req.files.file.name, (err)=>{
            if(err) console.log(err) 
        })
        console.log(process.cwd())
        post.picture = '/files/'+x+req.files.file.name 
    }
    
    post.save(function(err){ //to add to db
        if(err) {
            console.log(err)
            res.redirect('/sets/'+req.params.id)
        } else {
            res.redirect('/sets/'+req.params.id)
        }
    })
})

// SEARCH
app.post('/search', (req, res) => {
    let query = Post.find({ title: { $regex: req.body.search }}).sort({ $natural:-1 })
    query.exec(function(err, postsres){
        if(err){
            console.log(err)
        } else {
            res.render('search',{
                posts: postsres
            })
        }
    })
})

// DELETING STUFF
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx //
app.post('/delete-set/:id',(req, res) => {
    Post.deleteMany({ whichSet: req.params.id }, (err) => {
        if(err)
            console.log(err)
    })
    Set.findByIdAndDelete(req.params.id, (err) => {
        if(err)
            console.log(err)
    })
    res.redirect('/')
})

app.get('/delete-piece/:id/:setid',(req, res) => {
    Post.findByIdAndDelete(req.params.id, (err) => {
        if(err)
            console.log(err)
    })
    res.redirect('/sets/'+req.params.setid)
})
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx //

app.post('/update-piece-number/:id/:setid', (req,res) => {
    Post.findById(req.params.id, (err, post) => {
        if(err){
            console.log('error')
        } else {
            post.number = req.body.updatednumber
            Post.findByIdAndUpdate( req.params.id, post, (err) => {
                if(err){
                    console.log('error')
                } else {
                    res.redirect('/sets/'+req.params.setid)
                }
            })
        }
    })
})



// ******************************************************************* //
// Upload an entire set
app.post("/upload-set/:id/:setname",async (req, res) => {

    check = false

    if (req.files){

        var x = Math.floor((Math.random() * 1000) + 1);

        // create this file
        await req.files.file.mv('./files/'+x+req.files.file.name)

        // reading the file, somehow the consolelog fixed a bug
        console.log(process.cwd())

        fs.readFile('./files/'+x+req.files.file.name, 'utf8', (err, data) => {
            if(err) {
                console.log(err)
            } else {
                fs.unlink('./files/'+x+req.files.file.name, async (err) => {
                    if (err) {
                        return console.log(err)
                    } else {
                        var a = await operationsOnTheData(data, req.params.id, req.params.setname)

                        if (a) {
                            if (errors == 0) {
                                res.redirect('/sets/'+req.params.id)
                            } else {
                                res.redirect('/error/'+errors+'/'+req.params.id)
                            }
                        }

                    }
                })
            }
        })
    } 
});

app.get('/error/:msg/:id', (req,res) => {
    res.render('error',{
        msg: req.params.msg,
        id: req.params.id
    })
})

async function operationsOnTheData(data, whichSet, setName) {
    split_lines = data.split("\n");

    for (i = 0; i < split_lines.length-1; i++) {
        split_lines_parts = split_lines[i].split(",");
        // console.log(split_lines_parts)
        let post = new Post()
        
        var temp = '';
        temp = split_lines_parts[0].split(' ')
        post.picture = temp[0]
        // console.log(temp[0])

        var temp = '';
        temp = split_lines_parts[1].split(' ')
        post.number = Number(temp[0])
        post.title = temp[2]
        // console.log(Number(temp[0]) + '  ' + temp[2])
        
        post.whichSet = whichSet
        post.setName = setName
        // console.log(post.picture)
        // console.log(post.number+' '+post.title)
        post.save((err) => {
            if (err) {
                console.log(post.title)
                errors += ' ' + post.title
            }
        })
    }

    if( i == split_lines.length - 1) {
        return true
    }
}

// ******************************************************************* //





//start server
const PORT = process.env.PORT || 3000
//connect db
mongoose.connect(process.env.URI, {
    useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false
})
	.then(()=>console.log("DB Connected!"))
	.catch(err=>console.log(err))

app.listen(PORT, function(){
    console.log(`server started on port ${PORT}`)
})