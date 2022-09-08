const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const {campgroundSchema} = require('./schemas')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const methodOverride = require('method-override')
const Campground = require('./models/campground')

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database connected")
})

const app = express()
const {request, response} = require("express")

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

const validateCampground = (request, response, next) => {

    const { error } = campgroundSchema.validate(request.body)
    if (error) {
        const message = error.details.map(el => el.message).join(',')
        throw new ExpressError(message, 400)
    } else {
        next()
    }
}

app.get('/', (request, response) => {
    response.render('home')
})

app.get('/campgrounds', catchAsync(async(request, response) => {
    const campgrounds = await Campground.find({})
    response.render('campgrounds/index', { campgrounds })
}))

app.get('/campgrounds/new', (request, response) => {
    response.render('campgrounds/new')
})

app.post('/campgrounds', validateCampground, catchAsync(async (request, response, next) => {
    const campground = new Campground(request.body.campground)
    await campground.save()
    response.redirect(`/campgrounds/${campground._id}`)
}))

app.get('/campgrounds/:id', catchAsync(async (request, response) => {
    const campground = await Campground.findById(request.params.id)
    response.render('campgrounds/show', {campground})
}))

app.get('/campgrounds/:id/edit', catchAsync(async (request, response) => {
    const campground = await Campground.findById(request.params.id)
    response.render('campgrounds/edit', {campground})
}))

app.put('/campgrounds/:id', validateCampground, catchAsync(async (request, response) => {
    const { id } = request.params
    const campground = await Campground.findByIdAndUpdate(id, { ...request.body.campground })
    response.redirect(`/campgrounds/${campground._id}`)
}))

app.delete('/campgrounds/:id', catchAsync(async (request, response) => {
    const { id } = request.params
    await Campground.findByIdAndDelete(id)
    response.redirect('/campgrounds')
}))

app.all('*', (request, response, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((error, request, response, next) => {
    const {statusCode = 500} = error
    if(!error.message) error.message = 'Something went wrong!'
    response.status(statusCode).render('error', {error})
})

app.listen(8080, () => {
    console.log('Serving on port 8080')
})