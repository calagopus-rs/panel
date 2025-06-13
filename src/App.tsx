import { BrowserRouter, Route, Routes } from 'react-router';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Login from '@/pages/auth/Login';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
