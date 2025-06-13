import { BrowserRouter, Route, Routes } from "react-router";
import Home from "@/pages/Home";
import About from "@/pages/About";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
