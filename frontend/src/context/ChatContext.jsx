import { createContext, useState, useContext } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [chatLogs, setChatLogs] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  const addToHistory = (question, answer) => {
    const existingRoom = history.find((room) => room.question === question);

    if (!existingRoom) {
      const newRoom = {
        id: Date.now(),
        question,
        timestamp: new Date(),
      };
      setHistory((prev) => [...prev, newRoom]);

      setChatLogs((prev) => ({
        ...prev,
        [newRoom.id]: [
          {
            question,
            answer,
            timestamp: new Date(),
          },
        ],
      }));
    } else {
      setChatLogs((prev) => ({
        ...prev,
        [existingRoom.id]: [
          ...prev[existingRoom.id],
          {
            question,
            answer,
            timestamp: new Date(),
          },
        ],
      }));
    }
  };

  return (
    <ChatContext.Provider
      value={{
        question,
        setQuestion,
        answer,
        setAnswer,
        history,
        setHistory,
        chatLogs,
        setChatLogs,
        addToHistory,
        showHistory,
        setShowHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
