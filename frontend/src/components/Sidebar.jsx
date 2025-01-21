import React from "react";
import styled from "styled-components";

function HistorySidebar({
  localHistory,
  currentChatId,
  handleHistoryItemClick,
  handleDeleteHistory,
  handleAuthClick,
  isLoggedIn,
}) {
  const localHistory_sorted = [...localHistory].sort((a, b) => new Date(b.data[0].timestamp) - new Date(a.data[0].timestamp));
  return (
    <Sidebar>
      <SidebarContent>
        <TitleContainer>
          <Title>HISTORY</Title>
        </TitleContainer>
        
        {localHistory_sorted.map((chat) => (
          <HistoryItem
            key={chat.id}
            onClick={() => handleHistoryItemClick(chat)}
            active={chat.id === currentChatId}
          >
            <HeaderRow>
              {chat.category && (
                <HistoryCategory active={chat.id === currentChatId}>
                  {chat.category}
                </HistoryCategory>
              )}
              <DeleteButton onClick={(e) => handleDeleteHistory(chat.id, e)}>
                ×
              </DeleteButton>
            </HeaderRow>
            <HistoryQuestion>
              <HistoryQuestionText active={chat.id === currentChatId}>
                {chat.title}
              </HistoryQuestionText>
            </HistoryQuestion>
            <HistoryTime active={chat.id === currentChatId}>
              {new Date(chat.data[0].timestamp).toLocaleTimeString()} 
            </HistoryTime>
          </HistoryItem>
        ))}
      </SidebarContent>

      <LogoutButton onClick={handleAuthClick} isLoggedIn={isLoggedIn}>
        {isLoggedIn ? "로그아웃" : "로그인"}
      </LogoutButton>
    </Sidebar>
  );
}

export default HistorySidebar;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 100%;
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  position: relative;
  align-items: center;
  justify-content: center;
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 24px 0 24px;

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

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  padding: 0 40px 12px 40px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const HistoryItem = styled.div`
  padding: 16px;
  background-color: #ffffff;
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

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const HistoryCategory = styled.span`
  background-color: #ebf5ff;
  color: #2563eb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  width: fit-content;
  display: inline-block;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;

  &:hover {
    color: #ef4444;
  }
`;

const HistoryQuestion = styled.div`
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HistoryQuestionText = styled.div`
  font-weight: ${(props) => (props.active ? "600" : "400")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 220px;
`;

const HistoryTime = styled.div`
  font-size: 12px;
  color: #64748b;
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
  margin: 30px 0;
  position: relative;
  z-index: 1000;

  &:hover {
    background-color: ${(props) => (props.isLoggedIn ? "#475569" : "#1d4ed8")};
    transform: translateY(-1px);
  }
`;
