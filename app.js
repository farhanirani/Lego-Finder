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

app.get('/', (req, res) => {
    let query = Post.find({}).sort({$natural:-1})
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
    Post.findById(req.params.id, (err, post) => {
        res.render('edit_post', {
            post: post
        })
    })
})

app.post('/posts/:id', (req,res) => {
    let post = {};
    post.title = req.body.title
    post.whichSet = req.body.body
    
    let query = { _id:req.params.id }

    Post.updateOne(query, post, (err) => {
        if(err) {
            console.log(err)
            return
        } else {
            res.redirect('/')
        }
    })

})

app.get('/add-piece', (req, res) => {
    res.render('add-piece')
})

app.post('/add-piece', (req, res) => {
    let post = new Post()
    post.title = req.body.title
    post.whichSet = req.body.body
    
    post.save(function(err){ //to add to db
        if(err) {
            console.log(err)
            return
        } else {
            res.redirect('/add-piece')
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

app.post('/delete/:id',(req, res) => {
    Post.findByIdAndDelete(req.params.id, (err) => {
        if(err)
            console.log(err)
    })
    res.redirect('/')
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