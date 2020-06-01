let mongoose = require('mongoose')

//post schema
let postSchema = mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    whichSet:{
        type: String,
        required: true
    },
    setName:{
        type: String,
        required: true
    },
    number:{
        type: Number,
        required: true
    }
})

let Post = module.exports = mongoose.model('Post', postSchema)