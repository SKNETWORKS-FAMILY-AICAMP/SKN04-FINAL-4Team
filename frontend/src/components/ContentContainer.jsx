import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import '../style.css';
import {marked} from "marked";


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
  recv,
  isLoading,
}) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  let htmlContent="";
  if (recv !==null && recv.length !== 0) {
    htmlContent = marked(recv);
  }
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
        {(htmlContent !== null && htmlContent.length !== 0) && (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
          )}
      </ChatContainer>
      </ScrollableContent>

      <SearchContainer>
        <ButtonContainer>
          <ResetButton onClick={handleReset}>
            <ResetIcon>↺</ResetIcon>
          </ResetButton>
        </ButtonContainer>
        <SearchInput
          as="textarea"
          ref={inputRef}
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
          spellCheck={false}
        />
        {/* disabled={isLoading || inputValue.trim() === ''} */}
        <SearchButton onClick={handleSearch} >
          {isLoading ? '검색 중...' : '검색'}
        </SearchButton>
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
  align-items: center;

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
  max-width: 750px;
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
  max-width: 750px;
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
  max-width: 750px;
  align-items: flex-end;
  justify-content: center;
  align-self: center;
  width: 100%;
  gap: 16px;
  margin: 0 0;
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

const SearchInput = styled.textarea`
  flex: 6;
  width: 100%;
  max-width: 500px;
  min-height: 48px;
  max-height: 200px;
  padding: 0 20px;
  font-size: 15px;
  resize: none;
  overflow: auto;
  align-content: center;
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

const SearchButton = styled.button`
  
  width: 95px;
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

  &:disabled {
    cursor: default;
    opacity: 0.5;
    background: var(--button-bg-color, #025ce2);
  }
`;
