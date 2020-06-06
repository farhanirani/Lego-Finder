const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const upload = require('express-fileupload')
const fs = require('fs')
const path = require('path')

require('dotenv').config()


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

// Upload an entire set
app.post("/upload-set/:id/:setname", (req, res) => {
    if (req.files){

        var x = Math.floor((Math.random() * 1000) + 1);

        // create this file
        req.files.file.mv('./files/'+x+req.files.file.name, (err)=>{
            if(err) console.log(err) 
        })

        // reading the file, somehow the cl fixed a bug
        console.log(process.cwd())
        fs.readFile('./files/'+x+req.files.file.name, 'utf8', (err, data) => {
            if(err) {console.log(err)}
            else{
                split_lines = data.split("\r");

                for (i = 0; i < split_lines.length; i++) {
                    split_lines_parts = split_lines[i].split(",");
                    // console.log(split_lines_parts)
                    let post = new Post()
                    post.picture = split_lines_parts[0]
                    
                    temp = split_lines_parts[1].split(' ')
                    post.title = temp[2]
                    post.number = temp[0]

                    post.whichSet = req.params.id
                    post.setName = req.params.setname
                    post.save((err) => {
                        if (err) {console.log('error')}
                    })
                }

            }
        })

        fs.unlink('./files/'+x+req.files.file.name, (err) => {
            if (err) return console.log(err)
        })

    } 
    res.redirect('/sets/'+req.params.id)
});




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