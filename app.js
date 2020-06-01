const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()


//init app
const app = express()
//load view engine
app.set('view engine','pug')
//body parser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())




//bring in models
let Post = require('./models/post')
let Set = require('./models/set')

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


app.get('/posts/:id', function(req, res){
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

app.post('/add-piece/:id/:setname', (req, res) => {
    let post = new Post()
    post.title = req.body.body
    post.number = req.body.no
    post.whichSet = req.params.id
    post.setName = req.params.setname
    
    post.save(function(err){ //to add to db
        if(err) {
            console.log(err)
            return
        } else {
            res.redirect('/posts/'+req.params.id)
        }
    })
})

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
    res.redirect('/posts/'+req.params.setid)
})


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