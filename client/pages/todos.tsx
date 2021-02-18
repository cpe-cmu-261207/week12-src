import { useEffect, useState, Dispatch, SetStateAction, FC } from 'react'
import Axios from 'axios'
import { useRouter } from 'next/router'

interface Todo {
  id: number
  title: string
}

interface TodoFormProps {
  todos: Todo[]
  setTodos: Dispatch<SetStateAction<Todo[]>>
}

interface CreateTodoResponse {
  message: string
  data: Todo
}

const TodoForm: FC<TodoFormProps> = ({ todos, setTodos }) => {
  const [title, setTitle] = useState<string>('')

  return (
    <form 
      onSubmit={async e => {
        e.preventDefault()
        const token = localStorage.getItem('token')
        const { data } = await Axios.post<CreateTodoResponse>('http://localhost:3000/todos', {
          title,
        },
        {
          params: {
            token
          }
        })
        const todo = data.data
        setTodos([...todos, todo])
        setTitle('')
      }}>
      <input 
        type="text" 
        value={title} 
        onChange={e => setTitle(e.currentTarget.value)}/>
      <button>Create todo</button>
    </form>
  )
}

const Todos = () => {
  const router = useRouter()

  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')

        if (!token) throw Error('token is null')

        const { data } = await Axios.get<Todo[]>('http://localhost:3000/todos', {
          params: {
            token,
          }
        }) 

        setTodos(data)
        setLoading(false)
      } catch (e) {
        router.push('/login')
      }
    }
    fetch()
  }, [])

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div>
      <h2>Todos</h2>
      {todos.length !== 0 ? (
          <ul>
            {todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
          </ul>
        ):<p>nothing in here.</p>
      }
      <TodoForm {...{ todos, setTodos }}/>
    </div>
  )
}

export default Todos
