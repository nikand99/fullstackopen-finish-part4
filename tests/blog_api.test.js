const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')

let initialBlogs_lengt = 0

beforeEach(async () => {
  const saltRounds = 10
  const passwordHash = await bcrypt.hash('password', saltRounds)
  const passwordHash2 = await bcrypt.hash('password2', saltRounds)

  const initiaUser = 
  [
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
  let userObject2 = new User(initiaUser[1])
  await userObject2.save()

  await Blog.deleteMany({})
  const initialBlogs = [
    {
      title: 'React patterns',
      author: 'Michael Chan',
      url: 'https://reactpatterns.type.com/',
      likes: 7,
      user: userObject,
    },
    {
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      likes: 5,
      user: userObject2,
    },
  ]

  let blogObject = new Blog(initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[1])
  await blogObject.save()

  initialBlogs_lengt = initialBlogs.length
})

describe('uppdate of a blog', () => {
  test('succeeds with status code 200 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    // console.log('blogToUpdate.id: ', blogToUpdate)
    
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send({likes: 15})
      .expect(200)

    const blogsUpdated = await helper.blogsInDb()
    const blogsAtStartUpdated = blogsUpdated[0]
    expect(blogsAtStartUpdated.likes).toBe(15)
  })
})

describe('add a blog without any token.', () => {
  test('returns 401 Unauthorized if a token is not provided', async () => {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash('newpassword', saltRounds)

    const newUser = 
    {
      username: 'clabbe',
      name: 'Clabbe är bäst',
      passwordHash: passwordHash,
    }

    let userObject = new User(newUser)
    await userObject.save()


    const newBlog = 
    {
      title: 'title',
      author: 'Robert C. Martin',
      url: 'https://reactpatterns.type.com/',
      likes: 3,
      user: userObject,
    }
    
    // No token = 401 Unauthorized
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(
      initialBlogs_lengt
    )
  })
})

describe('delete of a blog', () => {
  test('succeeds with status code 204 if id is valid and token ok', async () => {
    const userInLogged = await api.post('/api/login').send({ username: 'nick', password: 'password' })
    const token = userInLogged.body.token  

    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    // console.log('blogsAtStart', blogsAtStart)
    // console.log('blogToDelete.id', blogToDelete.id, token)
    
    // id and token = status code 204
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(
      initialBlogs_lengt - 1
    )

    const authors = blogsAtEnd.map(r => r.author)
    expect(authors).not.toContain(blogToDelete.author)
  })
})


test('if you create a new blog with no title or URL, the backend will respond with status code 400 Bad Request', async () => {
  const newBlog = 
  {
    title: 'title',
    author: 'Robert C. Martin',
    likes: 3,
  }

  const userInLogged = await api.post('/api/login').send({ username: 'nick', password: 'password' })
  const token = userInLogged.body.token  
   
  // No URL = 400 Bad Request
  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)

  const responseUrl = await api.get('/api/blogs')
  // console.log('response.body', response.body)
  expect(responseUrl.body).toHaveLength(initialBlogs_lengt)

  const newBlog2 = 
  {
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 3,
  }
  // No title = 400 Bad Request
  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog2)
    .expect(400)

  const responseTitle = await api.get('/api/blogs')
  // console.log('response.body', response.body)
  expect(responseTitle.body).toHaveLength(initialBlogs_lengt)
})

test('if the likes property is missing from the request, it will default to the value 0', async () => {
  const newBlog = 
  {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
  }

  const userInLogged = await api.post('/api/login').send({ username: 'nick', password: 'password' })
  const token = userInLogged.body.token  
   
  // No likes = likes: { type: Number, default: 0, }
  const savedBlog = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  expect(savedBlog.body.likes).toBe(0)
})

test('HTTP POST creates a new blog post', async () => {
  const newBlog = 
  {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 3,
  }

  const userInLogged = await api.post('/api/login').send({ username: 'nick', password: 'password' })
  const token = userInLogged.body.token

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  // console.log('response.body', response.body)
  expect(response.body).toHaveLength(initialBlogs_lengt + 1)
})

test('id is unique identifier instead of _id', async () => {
  const response = await api.get('/api/blogs')
  const ids = response.body.map((blog) => blog.id)

  ids.forEach(id => {
    // console.log('id', id)
    expect(id).toBeDefined()
  })
})

test('there are two blogs', async () => {
  const response = await api.get('/api/blogs')
  // console.log('response.body', response.body)
  expect(response.body).toHaveLength(initialBlogs_lengt)
})

test('the first blog is about React patterns', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body[0].title).toBe('React patterns')
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
}, 100000)

afterAll(async () => {
  await mongoose.connection.close()
})
