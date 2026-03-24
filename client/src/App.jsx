import { useState } from 'react'
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Chat from './pages/Chat';
import Login from './pages/Login';


function App() {
  

  return (
    <>
    <Router>
      <Routes>
        <Route path = "/Login" element = {<Login/>} />
        <Route path = "/" element = {<Chat/>} />
      </Routes>
    </Router>
      
    </>
  )
}

export default App
