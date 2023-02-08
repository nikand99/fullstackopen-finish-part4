const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')
// const Blog = require('../models/blog')

usersRouter.get('/', async (request, response) => {

  const users = await User.find({}).populate('blogs', { 
    title: 1, 
    author: 1, 
    url: 1 
  })
  console.log(users)
  response.json(users)
})

usersRouter.get('/:id', async (request, response) => {
  try {
    const user = await User.findById(request.params.id)
    if (user) {
      response.json(user)
    } else {
      response.status(404).end()
    }
  }
  catch (error) {
    response.status(404).end()
  }
})

usersRouter.post('/', async (request, response, next) => {
  const { username, name, password } = request.body

  if(username === undefined ||username === '' ) {
    return response.status(400).json({error: 'Användarnamn måste anges'})
  }
  if( password === undefined || password === '') {
    return response.status(400).json({error: 'Lösenord måste anges'})
  }
  if(username.length < 3 || password.length < 3) {
    return response.status(400).json({error: 'Användarnamn och lösenord måste vara längre än 3 tecken'})
  }

  const usernameDb = await User.findOne({username: username})
  if(usernameDb) {
    return response.status(400).json({error: 'Användarnamn finns redan'})
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username: username,
    name: name,
    passwordHash: passwordHash,
  })

  try {
    const savedUser = await user.save()
    // console.log('savedUser 201', savedUser)
    response.status(201).json(savedUser)
  } 
  catch (error) {
    next(error)
    // console.log('savedUser 400')
    response.status(400).end()
  }
})

module.exports = usersRouter
