import Main from "../pages/Main";
import Login from "../pages/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />\
      </Routes>
    </BrowserRouter>
  );
}

export default App;
