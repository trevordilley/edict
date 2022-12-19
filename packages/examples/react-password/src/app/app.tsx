import { useEffect, useState } from 'react'
import { criteriaQuery, passwordQuery, session } from './rules'

export function App() {
  const [valid, setIsValid] = useState(false)
  const [criteria, setCriteria] = useState<
    { id: string; meetsCriteria: boolean }[]
  >([])
  useEffect(() => {
    passwordQuery.subscribeOne((password) =>
      setIsValid(password?.Password.valid ?? false)
    )
    criteriaQuery.subscribe((result) => {
      const c = result.map(({ $criteria: { id, meetsCriteria } }) => ({
        id,
        meetsCriteria,
      }))
      setCriteria(c)
    })
  })

  return (
    <div>
      <label>
        Enter your password{' '}
        <input
          type={'text'}
          onChange={(e) =>
            session.insert({
              Password: {
                password: e.target.value,
              },
            })
          }
        />
      </label>
      <ul>
        {criteria.map((c) => {
          return (
            <li key={c.id}>
              {c.id} is met? {c.meetsCriteria ? 'yes' : 'no'}
            </li>
          )
        })}
      </ul>
      <div>Password is {valid ? 'valid' : 'invalid'}</div>
    </div>
  )
}

export default App
