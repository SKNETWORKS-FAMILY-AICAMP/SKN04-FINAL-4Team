import Main from "../pages/Main";
import Login from "../pages/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "../context/ChatContext";

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />\
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
