import { useState } from 'react'
import { useRouter } from 'next/router'
import Axios from 'axios'

interface LoginResponse {
  token: string
}

const Login = () => {
  const router = useRouter()

  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>(null)

  return (
    <div>
      {error && <p>{error}</p>}
      <form 
        onSubmit={async e => {
          e.preventDefault()
          try {
            const { data } = await Axios.post<LoginResponse>('http://localhost:3000/login', {
              username,
              password,
            })
            localStorage.setItem('token', data.token)
            router.push('/todos')
          } catch(e) {
            setError('Invalid username or password')
          }
        }}>
        <div>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.currentTarget.value)} 
            type="text" />
        </div>
        <div>
          <input 
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            type="password"/>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login