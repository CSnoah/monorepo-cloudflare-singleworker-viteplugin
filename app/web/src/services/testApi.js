const getTest = async () => {
  const response = await fetch (`/api/hello`)
  const data = await response.text()
  return data
}

export default {
  getTest
}
