import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { sequelize, User, UserModel } from './models/user'

const SECRET_KEY = process.env.SECRET_KEY as string
const PORT = process.env.PORT || 3000

const app = express()
app.use(bodyParser.json())
app.use(cors())

interface DbSchema {
  todos: Todos
}

interface Todo {
  id: number
  title: string
}

interface Todos {
  [username: string]: Todo[]
}

type JWTPayload = Pick<UserModel, 'id' | 'username'>

const readDbFile = (): DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}

app.get('/', (req, res) => {
  res.json({ message: 'Hello world' })
})

app.get('/todos', (req, res) => {
  const token = req.query.token as string

  try {
    const data = jwt.verify(token, SECRET_KEY) as JWTPayload
    const db = readDbFile()
    const todos = db.todos[data.username] || []

    res.json(todos)

  } catch(e) {
    res.status(401)
    res.json({ message: e.message })
  }
})

type CreateTodosArgs = Pick<Todo, 'title'>

app.post<any, any, CreateTodosArgs>('/todos',
  body('title').isString(),
  (req, res) => {
    const token = req.query.token as string
    const { title } = req.body

    try {
      const data = jwt.verify(token, SECRET_KEY) as JWTPayload
      const db = readDbFile()
      const todos = db.todos[data.username] || []

      const newTodo: Todo = {
        id: Date.now(),
        title,
      }
      todos.push(newTodo)

      db.todos[data.username] = todos
      fs.writeFileSync('db.json', JSON.stringify(db))

      res.json({
        message: 'Created todo',
        data: newTodo,
      })
    } catch(e) {
      res.status(401)
      res.json({ message: e.message })
    }
  })

app.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  const token = req.query.token as string

  console.log(id)

  try {
    const data = jwt.verify(token, SECRET_KEY) as JWTPayload
    const db = readDbFile()
    const todos = db.todos[data.username] || []

    if (!todos.find(todo => todo.id === id)) {
      res.status(404)
      res.json({
        message: 'This todo not found'
      })
      return
    }

    const newTodos = todos.filter(todo => todo.id !== id)
    db.todos[data.username] = newTodos
    fs.writeFileSync('db.json', JSON.stringify(db))

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