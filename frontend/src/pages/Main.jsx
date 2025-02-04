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
  FaGavel,
  FaTools,
  FaScroll,
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
import '../style.css';

function Main() {
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [localHistory, setLocalHistory] = useState([]);
  // const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState(null);
  const [recvMessages, setRecvMessages] = useState("");
  const [humanMessages, setHumanMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);

  const ws = useRef(null);
  const historyMessages = useRef("");
  const isLoading = useRef(false);
  const scrollRef = useRef(null);
  const historytitle = useRef("")
  const currentChatId = useRef(null)
  const localHistoryRef = useRef([]);
  const currentThredId = useRef(null)

  // 검색 조건 (0일 땐 카테고리 선택 없이도 검색 가능)
  const searchConfig = {
    requireCategory: 0,
  };

  // 카테고리 목록
  const categories = useMemo(
    () => [
      { icon: <FaScroll />, name: "법령 문서" },
      { icon: <FaTools  />, name: "제품 메뉴얼" },
      // { icon: <FaGraduationCap />, name: "교육･여성가족･문화체육관광" },
      // { icon: <FaShieldAlt />, name: "국방･국가보훈" },
      // { icon: <FaUserTie />, name: "행정자치･인사･안전" },
      // { icon: <FaTractor />, name: "농림축산･산림･해양수산" },
      // { icon: <FaHeartbeat />, name: "보건복지･식품의약품" },
      // { icon: <FaTree />, name: "환경･고용노동" },
      // { icon: <FaRoad />, name: "국토교통" },
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

  const postHistory = async (title, content, thread_id) => {
    try {
      const API_URL = process.env.REACT_APP_API_SERVER;
      const token = localStorage.getItem('accessToken');
      console.log(token)
      const response = await axios.post(
        `${API_URL}/history/`,
        {"title":title, "data":content, "thread_id":thread_id},
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

  const deleteHistory = async (id) => {
    try {
      const API_URL = process.env.REACT_APP_API_SERVER;
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `${API_URL}/history/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('delete fail', error);
      throw error;
    }
  };

  const deleteThread = async (id) => {
    try {
      const API_URL = process.env.REACT_APP_API_SERVER;
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/delete_thread/`,
        {"thread_id": id},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response)
      return response.data;
    } catch (error) {
      console.error('DB delete fail', error);
      throw error;
    }
  }

  useEffect(() => {
        
  },[recvMessages]);

  const saveHistory = () => {
    const title = historytitle.current.slice(0, 50)
    if (!currentChatId.current) {
      postHistory(title, historyMessages.current, currentThredId.current).then(res =>{
        console.log(res)
        currentChatId.current = res.id
        // setCurrentChatId(res.id);
        setLocalHistory((prev) => [res, ...prev]);
        localHistoryRef.current = [res + localHistory.current]
      })
    } else {
      setLocalHistory((prev) =>
        prev.map((chat) => 
          chat.id === currentChatId.current
            ? { ...chat, title:title, data: historyMessages.current }
            : chat
        )
      );

      for (let i = 0; i< localHistoryRef.current.length; i++) {
        if (localHistoryRef.current[i].id === currentChatId.current) {
          patchHistory(title, localHistoryRef.current, currentChatId.current);
          break;
        }
      }
    }
  }

  const searchQuery = () => {
    if (isLoading.current) return;
    isLoading.current = true;
    try {
      const API_URL = process.env.REACT_APP_MODEL_API_SERVER;
      ws.current = new WebSocket(`${API_URL}`);
      ws.current.onerror = (error) => {
        console.error('WebSocket 에러:', error);
        setRecvMessages((prevMessages) => prevMessages + `<div class="human-message">커넥션 실패. 서버를 확인해주세요.</div>`);
        isLoading.current = false;
        return;
      };
    } catch (error) {
      console.error('커넥션 실패. 서버를 확인해주세요.', error);
      setRecvMessages((prevMessages) => prevMessages + `<div class="human-message">커넥션 실패. 서버를 확인해주세요.</div>`);
      isLoading.current = false;
      return;
    }
    
    
    ws.current.onopen = () => {
      // 사용자 쿼리를 서버에 전송
      const query = { query: inputValue, filter: selectedCategory, thread_id: currentThredId.current};
      ws.current.send(JSON.stringify(query));
      setRecvMessages((prevMessages) => prevMessages + `<div class="human-message">${inputValue}</div>\n`);
      historyMessages.current += `<div class="human-message">${inputValue}</div>\n`;
      historytitle.current = inputValue
      setInputValue(''); // 입력 필드 초기화
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    ws.current.onmessage = (event) => {
      if (event.data === '=== Start ===') {
        setRecvMessages((prevMessages) => prevMessages + `\n<div class="ai-message">\n\n`);
        historyMessages.current += `\n<div class="ai-message">\n\n`;
        return;
      }
      else if (event.data.includes('=== Thread_Id ===')) {
        currentThredId.current = event.data.split(':')[1]
        return;
      }
      if (event.data.trim() === '=== Done ===') {
        setRecvMessages((prevMessages) => prevMessages + `</div>\n`);
        historyMessages.current += `</div>\n`;
        isLoading.current = false;
        saveHistory()
        ws.current.close(); // 연결 종료
        return;
      }
      setRecvMessages((prevMessages) => prevMessages + event.data);
      historyMessages.current += event.data;
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket 에러:', error);
      // setMessages((prevMessages) => [...prevMessages, 'WebSocket 에러가 발생했습니다.']);
      isLoading.current = false;
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket 연결이 닫혔습니다.', event);
      // setMessages((prevMessages) => [...prevMessages, 'WebSocket 연결이 닫혔습니다.']);
      isLoading.current = false;
    };
    };
  }

  // 검색
  const handleSearch = useCallback(() => {
    if (searchConfig.requireCategory === 1 && selectedCategory === null) {
      alert("카테고리를 먼저 선택해주세요.");
      return;
    }
    if (!inputValue.trim()) return;

    searchQuery();
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
    currentChatId.current,
    createChatMessage,
    createNewChat,
    searchConfig,
  ]);

  const handleStopSearch = useCallback(() => {
    if (ws.current) {
      console.log("웹소켓 연결 중지(닫기)");
      historyMessages.current += `</div>`;
      isLoading.current = false;
      saveHistory()
      ws.current.close();   // onclose 이벤트에서 setIsSearching(false) 처리
    } else {
      // 혹시 이미 닫혀있다면, 별도로 처리할 일이 있으면 처리
      console.log("이미 웹소켓이 없거나 닫힘 상태입니다.");
      isLoading.current = false;
    }
  }, []);


  // 검색(Enter) 이벤트
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && e.shifkey){
        return;
      }
      else if (e.key === "Enter" && inputValue.trim() && isLoading.current !==true) {
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        handleSearch();
      }
    },
    [inputValue, handleSearch]
  );



  // 히스토리 클릭 시 해당 채팅이 나오게 함
  const handleHistoryItemClick = useCallback(
    (item) => {
      currentChatId.current = item.id
      // setCurrentChatId(item.id);
      currentThredId.current = item.thread_id
      const formattedMessages = item.data

      // setChatMessages(formattedMessages);
      setRecvMessages(formattedMessages);
      historyMessages.current = formattedMessages;
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
    setRecvMessages("");
    historyMessages.current = "";
    setSelectedCategory(null);
    currentChatId.current = null
    currentThredId.current = null
    // setCurrentChatId(null);
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
    localHistoryRef.current = []
    setSelectedCategory(null);
    setInputValue("");
    currentChatId.current = null
    currentThredId.current = null
    // setCurrentChatId(null);
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
    async (chatId, thread_id, e) => {
      e.stopPropagation();
      try {
        await deleteHistory(chatId);
        await deleteThread(thread_id);
        const response = await getHistory();
        setLocalHistory(response);
        localHistoryRef.current = response
        // 현재 보고 있던 채팅방이면 초기화
        if (chatId === currentChatId.current) {
          setRecvMessages("");
          currentChatId.current = null
          currentThredId.current = null
          // setCurrentChatId(null);
          historyMessages.current = "";
        }
      } catch (error) {
        console.error("삭제 중 오류 발생:", error);
      }
    },
    [localHistory, currentChatId.current]
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
        localHistoryRef.current = response
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
          currentChatId={currentChatId.current}
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
          handleSearch={isLoading.current ? handleStopSearch : handleSearch}
          handleReset={handleReset}
          searchConfig={searchConfig}
          recv={recvMessages}
          isLoading={isLoading.current}
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

const HumanMsg = styled.div`
  padding: 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 16px;
`;
