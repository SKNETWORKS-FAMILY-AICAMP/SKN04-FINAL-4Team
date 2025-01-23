import React from "react";
import styled from "styled-components";

function ContentContainer({
  scrollRef,
  chatMessages,
  categories,
  selectedCategory,
  handleCategoryClick,
  inputValue,
  setInputValue,
  handleKeyPress,
  handleSearch,
  handleReset,
  searchConfig,
}) {
  return (
    <ContentWrapper>
      <ScrollableContent ref={scrollRef}>
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
              onClick={() => handleCategoryClick(index)}
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
                  <QuestionText>
                    {selectedCategory !== null && (
                      <CategoryTag>
                        {categories[selectedCategory].name}
                      </CategoryTag>
                    )}
                    {typeof message.content === "object"
                      ? message.content.props.children[1]
                      : message.content}
                  </QuestionText>
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
        <SearchInput
          type="text"
          placeholder={
            searchConfig.requireCategory === 1 && selectedCategory === null
              ? "카테고리를 먼저 선택해주세요"
              : "검색어를 입력하세요"
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={
            searchConfig.requireCategory === 1 && selectedCategory === null
          }
        />
        <SearchButton onClick={handleSearch}>검색</SearchButton>
      </SearchContainer>
    </ContentWrapper>
  );
}

export default ContentContainer;

const ContentWrapper = styled.div`
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

const SelectedCategory = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
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

const CategoryButton = styled.button`
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
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
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
`;

const ChatContainer = styled.div`
  flex: 1;
  margin-top: 20px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
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

  &:before {
    content: "Q.";
    color: #2563eb;
    font-weight: 600;
    margin-right: 8px;
  }

  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
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

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: fit-content;
  margin: 0 auto;
  padding: 24px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
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

const SearchInput = styled.input`
  width: 500px;
  height: 48px;
  padding: 0 20px;
  font-size: 15px;
  color: #334155;
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:focus {
    background-color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }

  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
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
