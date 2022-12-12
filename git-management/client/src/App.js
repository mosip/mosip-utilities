import './App.css'
import {Route, Routes} from 'react-router-dom'

import Box from '@mui/material/Box'

import Navbar from './components/Navbar'
import Errorpage from './components/Errorpage'
import Home from './components/Home'
import Repo from './components/Repo'
import Branch from './components/Branch'

function App() {
  return (
    <Box>
      <Navbar/>

      <Routes>
        <Route  exact path="/" element={<Home />} />
        <Route  exact path="/Repo" element={<Repo />} />
        <Route  exact path="/Branch" element={<Branch />} />
        <Route  exact path="*" element={<Errorpage />} />
      </Routes>
    
    </Box>
  );
}

export default App;
