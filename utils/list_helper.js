// const blog = require('../models/blog')
const _ = require('lodash')
// const logger = require('../utils/logger')

const dummy = (blogs) => {
  if(blogs.length > 0) {
    return 1
  }
  return 0
}

const totalLikes = (blogs) => {
  // logger.info('blogs', blogs)
  const likes = blogs.reduce((sum, blog) => sum + blog.likes, 0) 
  return likes
}

const favoriteBlog = (blogs) => {
  const favorite = blogs.reduce((sum, blog) => (sum.likes > blog.likes) ? sum : blog) 
  // logger.info('favorite', favorite)

  const blog = {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes
  }
  // logger.info('blog', blog)
  return blog
}

const mostBlogs = (blogs) => {
  var earcning  = _.chain(blogs)
    .groupBy('author')
    .map((favoritebloger, author) => {
      return {author: author, blogs: favoritebloger.length}
    })
    .maxBy((object) => object.blogs)
    .value()

  // logger.info('earcning: ', earcning)
  return earcning
}

const mostLikes = (blogs) => {

  var earcning  = _.chain(blogs)
    .groupBy('author')
    .map((favoritelikes, author) => {
      return {
        author: author, 
        likes: favoritelikes.reduce((sum, blog) => {
          return (sum += blog.likes)
        }, 0),
      }
    })
    .maxBy((object) => object.likes)
    .value()

  // logger.info('earcning: ', earcning)
  return earcning
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
