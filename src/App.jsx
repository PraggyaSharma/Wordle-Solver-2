import { useState } from 'react'

import './App.css'
import Solver1 from './components/Solver1'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Solver1 />
    </>
  )
}

export default App
