import { useState, useEffect } from 'react'
import api from './services/testApi'

function App() {
  const [data, setData] = useState('')

  useEffect(() => {
    const getData = async () => {
      const result = await api.getTest()
      setData(result)
    }
    
    getData()
  }, [])


  return (
    <>
      <div>
        <h1>API OUTPUT: {data}</h1>
      </div>

    </>
  )
}

export default App
