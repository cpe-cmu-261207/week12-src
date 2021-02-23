import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { sequelize } from './configs/sequelize'
import { User, UserModel } from './models/user'
import { Todo, TodoModel } from './models/todo'

const SECRET_KEY = process.env.SECRET_KEY as string
const PORT = process.env.PORT || 3000

const app = express()
app.use(bodyParser.json())
app.use(cors())

type JWTPayload = Required<Pick<UserModel, 'id' | 'username'>>

app.get('/', (req, res) => {
  res.json({ message: 'Hello world' })
})

app.get('/todos', async (req, res) => {
  const token = req.query.token as string

  try {
    const data = jwt.verify(token, SECRET_KEY) as JWTPayload
    const todos = await Todo.findAll({ where: { userId: data.id } })

    res.json(todos)
  } catch(e) {
    res.status(401)
    res.json({ message: e.message })
  }
})

type CreateTodosArgs = Pick<TodoModel, 'title' | 'description'>

app.post<any, any, CreateTodosArgs>('/todos',
  body('title').isString(),
  async (req, res) => {
    const token = req.query.token as string
    const { title, description } = req.body

    try {
      const data = jwt.verify(token, SECRET_KEY) as JWTPayload

      const todo = await Todo.create({
        userId: data.id,
        title,
        description,
      })

      res.json({
        message: 'Created todo',
        data: todo,
      })
    } catch(e) {
      res.status(401)
      res.json({ message: e.message })
    }
  })

app.delete('/todos/:id', async (req, res) => {
  const id = Number(req.params.id)
  const token = req.query.token as string

  console.log(id)

  try {
    const data = jwt.verify(token, SECRET_KEY) as JWTPayload

    const todo = await Todo.destroy({ where: { id, userId: data.id } })

    if (todo === 0) {
      res.status(404)
      res.json({
        message: 'This todo not found'
      })
      return
    }

    res.json({
      message: 'Deleted todo'
    })

  } catch(e) {
    res.status(401)
    res.json({ message: e.message })
  }
})

app.get('/users', async (req, res) => {
  const users = await User.findAll()
  res.json(users)
})

type RegisterArgs = Omit<UserModel, 'id'>

app.post<any, any, RegisterArgs>('/register', 
  body('username').isString(),
  body('password').isString(),
  async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      res.status(400)
      res.json(errors)
      return
    }

    req.body.password = bcrypt.hashSync(req.body.password, 10)
    try {
      const user = await User.create(req.body)
      res.json({ message: 'Register complete', data: user })
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        res.status(400)
        res.json({ message: `This ${e.fields[0]} is already used` })
      }

      res.status(500)
      res.json({ message: 'Internal server error' })
    }
  })

type LoginArgs = Pick<UserModel, 'username' | 'password'>

app.post<any, any, LoginArgs>('/login', async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ where: { username } })
  const userAttrs = user?.get()

  if (!userAttrs || !bcrypt.compareSync(password, userAttrs.password)) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }

  const token = jwt.sign(
    { id: userAttrs.id, username: userAttrs.username } as JWTPayload, 
    SECRET_KEY
  )
  res.json({ token })
})

app.get('/secret', (req, res) => {
  const token = req.headers.authorization
  if (!token) {
    res.status(401)
    res.json({ message: 'Require authorization header'})
    return
  }
  try {
    const data = jwt.verify(token.split(" ")[1], SECRET_KEY)
    res.json(data)
  } catch(e) {
    res.status(401)
    res.json({ message: e.message })
  }
})

app.listen(PORT, async () => {
  await sequelize.sync()
  console.log(`Server is running at ${PORT}`)
})