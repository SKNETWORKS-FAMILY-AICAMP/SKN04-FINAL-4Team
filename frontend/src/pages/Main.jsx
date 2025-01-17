import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaIndustry,
  FaGraduationCap,
  FaShieldAlt,
  FaUserTie,
  FaTractor,
  FaHeartbeat,
  FaTree,
  FaRoad,
  FaEllipsisH,
} from "react-icons/fa";
import axios from "axios";

import NavBar from "../components/NavBar";
import HistorySidebar from "../components/Sidebar";
import ContentContainer from "../components/ContentContainer";
import SourceSidebar from "../components/SourceSidebar";

function Main() {
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [localHistory, setLocalHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState(null);

  const scrollRef = useRef(null);

  // 검색 조건 (0일 땐 카테고리 선택 없이도 검색 가능)
  const searchConfig = {
    requireCategory: 0,
  };

  // 카테고리 목록
  const categories = useMemo(
    () => [
      { icon: <FaMoneyBillWave />, name: "기획재정･금융･공정거래" },
      { icon: <FaIndustry />, name: "산업통상자원･중소기업" },
      { icon: <FaGraduationCap />, name: "교육･여성가족･문화체육관광" },
      { icon: <FaShieldAlt />, name: "국방･국가보훈" },
      { icon: <FaUserTie />, name: "행정자치･인사･안전" },
      { icon: <FaTractor />, name: "농림축산･산림･해양수산" },
      { icon: <FaHeartbeat />, name: "보건복지･식품의약품" },
      { icon: <FaTree />, name: "환경･고용노동" },
      { icon: <FaRoad />, name: "국토교통" },
      { icon: <FaEllipsisH />, name: "기타" },
    ],
    []
  );

  // 출처 문서 목록
  const sourceDocuments = useMemo(
    () => [
      {
        id: 1,
        title: "고등교육법 시행령",
        link: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EA%B3%A0%EB%93%B1%EA%B5%90%EC%9C%A1%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9",
      },
      {
        id: 2,
        title: "학교폭력예방 및 대책에 관한 법률",
        link: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%ED%95%99%EA%B5%90%ED%8F%AD%EB%A0%A5%EC%98%88%EB%B0%A9%EB%B0%8F%EB%8C%80%EC%B1%85%EC%97%90%EA%B4%80%ED%95%9C%EB%B2%95%EB%A5%A0",
      },
      {
        id: 3,
        title: "지방교육자치에 관한 법률",
        link: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A7%80%EB%B0%A9%EA%B5%90%EC%9C%A1%EC%9E%90%EC%B9%98%EC%97%90%EA%B4%80%ED%95%9C%EB%B2%95%EB%A5%A0",
      },
    ],
    []
  );

  const handleAuthClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      handleLogout();
    }
  };

  // 새 질문·답변 메시지 생성
  const createChatMessage = useCallback(
    (questionText, timestamp) => ({
      question: {
        type: "question",
        content: questionText,
        timestamp,
      },
      answer: {
        type: "answer",
        content: `"${inputValue}"에 대한 답변입니다.`,
        timestamp,
      },
    }),
    [inputValue]
  );
 
  // 새로운 채팅방 생성
  const createNewChat = useCallback(
    (chatId, author, title, messages) => ({
      id: chatId,
      author,
      title,
      data:messages
    }),
    []
  );

  const postHistory = async (title, content) => {
    try {
      const API_URL = process.env.REACT_APP_API_SERVER;
      const token = localStorage.getItem('accessToken');
      console.log(token)
      const response = await axios.post(
        `${API_URL}/history/`,
        {"title":title, "data":content},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('post fail', error);
      throw error;
    }
  };

  const patchHistory = async (title, content, id) => {
    try {
      const API_URL = process.env.REACT_APP_API_SERVER;
      const token = localStorage.getItem('accessToken');
      const response = await axios.patch(
        `${API_URL}/history/${id}/`,
        {"title":title, "data":content},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('path fail', error);
      throw error;
    }
  };

  const getHistory = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_SERVER;
      const token = localStorage.getItem('accessToken');
      const api = axios.create(
        {
          baseURL: `${API_URL}`, // Django 서버 주소
          withCredentials: true, // CORS 정책에서 Credentials 지원
        }
      )
      const response = await api.get(
        `/history/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('get fail', error);
      throw error;
    }
  };


  // 검색
  const handleSearch = useCallback(() => {
    if (searchConfig.requireCategory === 1 && selectedCategory === null) {
      alert("카테고리를 먼저 선택해주세요.");
      return;
    }
    if (!inputValue.trim()) return;
    const token = localStorage.getItem('accessToken');
    const timestamp = new Date();
    const { question, answer } = createChatMessage(
      inputValue,
      timestamp
    );
    const title = inputValue.slice(0, 50)
    // 기존 채팅 메시지에 업데이트
    const updatedMessages = [...chatMessages, question, answer];
    // 채팅방 최초 생성할 때
    if (!currentChatId) {
      const newChatId = Date.now().toString();
      const newChat = createNewChat(
        newChatId,
        '',
        title,
        updatedMessages,
      );
      postHistory(title, updatedMessages).then(res =>{
        console.log(res)
        setCurrentChatId(res.id);
        newChat.id = res.id
        newChat.author = res.author
        setLocalHistory((prev) => [res, ...prev]);
      })
    } else {
      // 기존 채팅방일 때
      setLocalHistory((prev) =>
        prev.map((chat) => 
          chat.id === currentChatId
            ? { ...chat, title:title, data: updatedMessages }
            : chat
        )
      );
      for (let i = 0; i< localHistory.length; i++) {
        if (localHistory[i].id === currentChatId) {
          patchHistory(title, updatedMessages, currentChatId);
          break;
        }
      }
    }
    
    setChatMessages(updatedMessages);
    setInputValue("");

    // 자동 스크롤
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, [
    inputValue,
    selectedCategory,
    categories,
    chatMessages,
    currentChatId,
    createChatMessage,
    createNewChat,
    searchConfig,
  ]);

  // 검색(Enter) 이벤트
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && inputValue.trim()) {
        handleSearch();
      }
    },
    [inputValue, handleSearch]
  );

  // 히스토리 클릭 시 해당 채팅이 나오게 함
  const handleHistoryItemClick = useCallback(
    (item) => {
      setCurrentChatId(item.id);
      const formattedMessages = item.data

      setChatMessages(formattedMessages);

      const categoryIndex = categories.findIndex(
        (cat) => cat.name === item.category
      );
      setSelectedCategory(categoryIndex !== -1 ? categoryIndex : null);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    },
    [categories]
  );

  // 전체 리셋
  const handleReset = useCallback(() => {
    setChatMessages([]);
    setSelectedCategory(null);
    setCurrentChatId(null);
  }, []);

  // 로그아웃
  const handleLogout = useCallback(() => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    alert('로그아웃 되었습니다.');
    setIsLoggedIn(false);
    setChatMessages([]);
    setLocalHistory([]);
    setSelectedCategory(null);
    setInputValue("");
    setCurrentChatId(null);
  }, []);

  // 카테고리 버튼 클릭
  const handleCategoryClick = (categoryIndex) => {
    // 같은 카테고리 클릭 시 해제
    setSelectedCategory(
      selectedCategory === categoryIndex ? null : categoryIndex
    );
  };

  // 히스토리에서 특정 채팅 삭제
  const handleDeleteHistory = useCallback(
    (chatId, e) => {
      e.stopPropagation();
      const updatedHistory = localHistory.filter((chat) => chat.id !== chatId);
      setLocalHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

      // 현재 보고 있던 채팅방이면 초기화
      if (chatId === currentChatId) {
        setChatMessages([]);
        setCurrentChatId(null);
      }
    },
    [localHistory, currentChatId]
  );

  // 마우스 hover 시 미리보기 처리
  const handleMouseEnter = (doc) => {
    setHoveredDoc(doc);
  };
  const handleMouseLeave = () => {
    setHoveredDoc(null);
  };

  // 로그인 상태일 때 기존 히스토리를 불러옴
  useEffect(() => {
    const loginStatus = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loginStatus);

    if (loginStatus) {
      // const savedHistory = localStorage.getItem("chatHistory");
      getHistory().then(response => {
        console.log(response)
        setLocalHistory(response);
      })
    }
  }, []);

  return (
    <Container>
      <Overlay isActive={!isLoggedIn} />
      <NavBar handleReset={handleReset} />
      <MainContainer>
        <HistorySidebar
          localHistory={localHistory}
          currentChatId={currentChatId}
          handleHistoryItemClick={handleHistoryItemClick}
          handleDeleteHistory={handleDeleteHistory}
          handleAuthClick={handleAuthClick}
          isLoggedIn={isLoggedIn}
        />
        <ContentContainer
          scrollRef={scrollRef}
          chatMessages={chatMessages}
          categories={categories}
          selectedCategory={selectedCategory}
          handleCategoryClick={handleCategoryClick}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleKeyPress={handleKeyPress}
          handleSearch={handleSearch}
          handleReset={handleReset}
          searchConfig={searchConfig}
        />
        {chatMessages.length > 0 && (
          <SourceSidebar
            sourceDocuments={sourceDocuments}
            hoveredDoc={hoveredDoc}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
          />
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

const MainContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: calc(100% - 64px);
  overflow: hidden;
`;

const QuestionWithCategory = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CategoryTag = styled.span`
  background-color: #ebf5ff;
  color: #2563eb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  margin-right: 8px;
  flex-shrink: 0;
`;
