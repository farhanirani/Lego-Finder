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
    }
})

let Post = module.exports = mongoose.model('Post', postSchema)