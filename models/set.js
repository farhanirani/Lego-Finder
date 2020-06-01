let mongoose = require('mongoose')

//post schema
let setSchema = mongoose.Schema({
    title:{
        type: String,
        required: true
    }
})

let Set = module.exports = mongoose.model('Set', setSchema)