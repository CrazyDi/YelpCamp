const express = require('express')
const app = express()
const path = require('path')
const {request, response} = require("express");

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', (request, response) => {
    response.render('home')
})

app.listen(8080, () => {
    console.log('Serving on port 8080')
})