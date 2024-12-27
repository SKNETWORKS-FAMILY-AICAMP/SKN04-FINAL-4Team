import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo } from "react";
import { FaRegSnowflake, FaTv, FaWind } from "react-icons/fa";
import { GiWashingMachine, GiVacuumCleaner } from "react-icons/gi";
import { MdKitchen, MdDevicesOther } from "react-icons/md";

function Main() {
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [localHistory, setLocalHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const categories = useMemo(
    () => [
      { icon: <FaRegSnowflake />, name: "냉장고" },
      { icon: <GiWashingMachine />, name: "세탁기" },
      { icon: <FaWind />, name: "에어컨" },
      { icon: <FaTv />, name: "TV" },
      { icon: <MdKitchen />, name: "주방가전" },
      { icon: <GiVacuumCleaner />, name: "청소기" },
      { icon: <MdDevicesOther />, name: "기타 가전" },
    ],
    []
  );

  const sourceDocuments = useMemo(
    () => [
      {
        id: 1,
        title: "냉장고 사용설명서.pdf",
        link: "https://www.lge.co.kr/",
        pages: "p.15-18",
      },
      {
        id: 2,
        title: "세탁기 매뉴얼.pdf",
        link: "https://www.lge.co.kr/",
        pages: "p.23-25",
      },
      {
        id: 3,
        title: "에어컨 설치 가이드.pdf",
        link: "https://www.lge.co.kr/",
        pages: "p.45-48",
      },
    ],
    []
  );

  // 채팅 메시지 생성
  const createChatMessage = useCallback(
    (questionText, timestamp) => ({
      question: {
        type: "question",
        content: questionText,
        timestamp,
      },
      answer: {
        type: "answer",
        content: `"${questionText}"에 대한 답변입니다.`,
        timestamp,
      },
    }),
    []
  );

  // 새로운 채팅방 생성
  const createNewChat = useCallback(
    (chatId, category, question, messages, timestamp) => ({
      id: chatId,
      category,
      firstQuestion: question,
      messages,
      timestamp,
    }),
    []
  );

  const handleNavClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleSearch = useCallback(() => {
    if (!inputValue.trim()) return;

    const timestamp = new Date();
    const questionText =
      selectedCategory !== null
        ? `[${categories[selectedCategory].name}] ${inputValue}`
        : inputValue;

    const { question, answer } = createChatMessage(questionText, timestamp);
    const updatedMessages = [...chatMessages, question, answer];

    if (!currentChatId) {
      const newChatId = Date.now().toString();
      const newChat = createNewChat(
        newChatId,
        selectedCategory !== null ? categories[selectedCategory].name : "",
        questionText,
        updatedMessages,
        timestamp
      );

      setCurrentChatId(newChatId);
      setLocalHistory((prev) => [newChat, ...prev]);
    } else {
      setLocalHistory((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: updatedMessages }
            : chat
        )
      );
    }

    setChatMessages(updatedMessages);
    setInputValue("");
  }, [
    inputValue,
    selectedCategory,
    categories,
    chatMessages,
    currentChatId,
    createChatMessage,
    createNewChat,
  ]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && inputValue.trim()) {
        handleSearch();
      }
    },
    [inputValue, handleSearch]
  );

  const handleCategorySelect = useCallback(
    (index) => {
      if (currentChatId) {
        setChatMessages([]);
        setCurrentChatId(null);
      }
      setSelectedCategory(index);
    },
    [currentChatId]
  );

  const handleHistoryItemClick = useCallback(
    (item) => {
      setCurrentChatId(item.id);
      setChatMessages(item.messages);
      const categoryIndex = categories.findIndex(
        (cat) => cat.name === item.category
      );
      setSelectedCategory(categoryIndex !== -1 ? categoryIndex : null);
    },
    [categories]
  );

  const handleReset = useCallback(() => {
    setChatMessages([]);
    setSelectedCategory(null);
    setCurrentChatId(null);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(!isLoggedIn);
  }, [isLoggedIn]);

  const handleSourceClick = useCallback(
    (id) => {
      const doc = sourceDocuments.find((doc) => doc.id === id);
      if (doc?.link) {
        window.open(doc.link, "_blank");
      }
    },
    [sourceDocuments]
  );

  return (
    <Container>
      <Overlay isActive={!isLoggedIn} />
      <Nav onClick={handleNavClick}>CS Agent</Nav>
      <MainContainer>
        <Sidebar>
          <SidebarContent>
            <HistoryTitle>이전 기록</HistoryTitle>
            {localHistory.map((chat) => (
              <HistoryItem
                key={chat.id}
                onClick={() => handleHistoryItemClick(chat)}
                active={chat.id === currentChatId}
              >
                <HistoryQuestion>{chat.firstQuestion}</HistoryQuestion>
                <HistoryTime>
                  {new Date(chat.timestamp).toLocaleTimeString()}
                </HistoryTime>
              </HistoryItem>
            ))}
          </SidebarContent>
          <LogoutButton onClick={handleLogout} isLoggedIn={isLoggedIn}>
            {isLoggedIn ? "로그아웃" : "로그인"}
          </LogoutButton>
        </Sidebar>
        <ContentContainer>
          <ScrollableContent>
            {selectedCategory !== null && (
              <SelectedCategory>
                <CategoryIcon>{categories[selectedCategory].icon}</CategoryIcon>
                {categories[selectedCategory].name}
              </SelectedCategory>
            )}
            <CategoryGrid>
              {categories.map((category, index) => (
                <CategoryButton
                  key={index}
                  onClick={() => handleCategorySelect(index)}
                  isSelected={selectedCategory === index}
                >
                  <IconWrapper isSelected={selectedCategory === index}>
                    {category.icon}
                  </IconWrapper>
                  <CategoryName>{category.name}</CategoryName>
                </CategoryButton>
              ))}
            </CategoryGrid>
            <ChatContainer>
              {chatMessages.map((message, index) => {
                if (
                  message.type === "question" &&
                  index + 1 < chatMessages.length
                ) {
                  const answer = chatMessages[index + 1];
                  return (
                    <ChatItem key={index}>
                      <QuestionText>{message.content}</QuestionText>
                      <AnswerText>{answer.content}</AnswerText>
                    </ChatItem>
                  );
                }
                return null;
              })}
            </ChatContainer>
          </ScrollableContent>
          <SearchContainer>
            <ButtonContainer>
              <ResetButton onClick={handleReset}>
                <ResetIcon>↺</ResetIcon>
              </ResetButton>
            </ButtonContainer>
            <Input
              type="text"
              placeholder="궁금한 것을 물어보세요"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <SearchButton onClick={handleSearch}>검색</SearchButton>
          </SearchContainer>
        </ContentContainer>
        {chatMessages.length > 0 && (
          <SourceSidebar>
            <SourceTitle>답변 출처</SourceTitle>
            <SourceContent>
              {sourceDocuments.map((doc) => (
                <SourceItem
                  key={doc.id}
                  onClick={() => handleSourceClick(doc.id)}
                >
                  <SourceName>{doc.title}</SourceName>
                  <SourcePages>{doc.pages}</SourcePages>
                  <SourceLink
                    href={doc.link}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    원문 링크 이동
                  </SourceLink>
                </SourceItem>
              ))}
            </SourceContent>
          </SourceSidebar>
        )}
      </MainContainer>
    </Container>
  );
}

export default Main;

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  font-family: "Pretendard", sans-serif;
  font-size: 16px;
  color: #333;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
`;

const Nav = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 60px;
  font-weight: 200;
  height: 64px;
  padding: 0 32px;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-left: 80px;

  &:hover {
    color: #2563eb;
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: calc(100% - 64px);
  overflow: hidden;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`;

const ChatContainer = styled.div`
  flex: 1;
  margin-bottom: 24px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 95%;
  padding: 24px;
  gap: 8px;
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
`;

const CategoryButton = styled.button`
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: ${(props) => (props.isSelected ? "#EBF5FF" : "#f8fafc")};
  border: 1px solid ${(props) => (props.isSelected ? "#2563eb" : "#e2e8f0")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background-color: #f1f5f9;
    border-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: ${(props) => (props.isSelected ? "#2563eb" : "#64748b")};
  margin-right: 12px;
  transition: color 0.2s ease;
`;

const CategoryName = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
`;

const ChatItem = styled.div`
  padding: 24px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 16px;
`;

const QuestionText = styled.div`
  font-size: 15px;
  color: #1f2937;
  margin-bottom: 16px;
  line-height: 1.5;
  font-weight: 500;

  &:before {
    content: "Q. ";
    color: #2563eb;
    font-weight: 600;
  }
`;

const AnswerText = styled.div`
  font-size: 15px;
  color: #1f2937;
  line-height: 1.5;

  &:before {
    content: "A. ";
    color: #2563eb;
    font-weight: 600;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 100%;
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  position: relative;
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
`;

const HistoryTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
`;

const HistoryItem = styled.div`
  padding: 16px;
  background-color: ${(props) => (props.active ? "#EBF5FF" : "#ffffff")};
  border: 1px solid ${(props) => (props.active ? "#2563eb" : "#e2e8f0")};
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
  }
`;

const LogoutButton = styled.button`
  width: 80%;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background-color: ${(props) => (props.isLoggedIn ? "#64748b" : "#2563eb")};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 40px;
  margin-left: 30px;
  position: relative;
  z-index: 1000;

  &:hover {
    background-color: ${(props) => (props.isLoggedIn ? "#475569" : "#fecaca")};
    transform: translateY(-1px);
  }
`;

const Input = styled.input`
  width: 500px;
  height: 48px;
  padding: 0 20px;
  font-size: 15px;
  color: #334155;
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
  margin-right: 16px;

  &:focus {
    background-color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SearchButton = styled.button`
  padding: 0 28px;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  background-color: #2563eb;
  border: none;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: #64748b;
  border: none;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #475569;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ResetIcon = styled.span`
  font-size: 20px;
  font-weight: bold;
  color: white;
`;

const HistoryQuestion = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.5;
`;

const HistoryTime = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const SourceSidebar = styled.div`
  width: 300px;
  height: 100%;
  background-color: #f8fafc;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
`;

const SourceTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const SourceContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const SourceItem = styled.div`
  padding: 16px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
  }
`;

const SourceName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
`;

const SourcePages = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
`;

const SourceLink = styled.a`
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background-color: #ebf5ff;
    text-decoration: underline;
  }
`;

const SelectedCategory = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
  padding: 0 24px;
`;

const CategoryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #2563eb;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 999;
  pointer-events: ${(props) => (props.isActive ? "auto" : "none")};
  opacity: ${(props) => (props.isActive ? 1 : 0)};
`;