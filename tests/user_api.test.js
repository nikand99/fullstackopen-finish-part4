const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const supertest = require('supertest')

// const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')

let initiaUser_length = 0

beforeEach(async () => {
  const saltRounds = 10
  const passwordHash = await bcrypt.hash('password', saltRounds)
  const passwordHash2 = await bcrypt.hash('password2', saltRounds)

  const initiaUser = [
    {
      username: 'nick',
      name: 'Clabbe är bäst',
      passwordHash: passwordHash,
    },
    {
      username: 'test',
      name: 'Clabbe',
      passwordHash: passwordHash2,
    },
  ]

  await User.deleteMany({})
  let userObject = new User(initiaUser[0])
  await userObject.save()
  userObject = new User(initiaUser[1])
  await userObject.save()

  initiaUser_length = initiaUser.length
})

test('if you create a new user with no username or passwordHash < 3, the backend will respond with status code 400 Bad Request', async () => {

  const newUser = 
  {
    username: '',
    name: 'Clabbe är bäst',
    passwordHash: 'testPassword',
  }
  
  // username < 3
  await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const responseUrl = await api.get('/api/blogs')
  // console.log('responseUrl.body', responseUrl.body)
  expect(responseUrl.body).toHaveLength(initiaUser_length)

  
  const newBlog2 = 
  {
    username: 'nick2',
    name: 'Clabbe är bäst',
    passwordHash: '',
  }
    
  // passwordHash < 3
  await api
    .post('/api/users')
    .send(newBlog2)
    .expect(400)

  const responseTitle = await api.get('/api/blogs')
  // console.log('response.body', response.body)
  expect(responseTitle.body).toHaveLength(initiaUser_length)
} )

test('users are returned as json', async () => {
  await api
    .get('/api/users')
    .expect(200)
    .expect('Content-Type', /application\/json/)
}, 100000)

afterAll(async () => {
  await mongoose.connection.close()
})




