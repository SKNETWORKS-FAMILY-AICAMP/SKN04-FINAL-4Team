import React from "react";
import styled from "styled-components";

function SourceSidebar({
  sourceDocuments,
  hoveredDoc,
  handleMouseEnter,
  handleMouseLeave,
}) {
  return (
    <SourceContainer>
      <SourceContent>
        <TitleContainer>
          <Title>답변 출처</Title>
        </TitleContainer>

        {sourceDocuments.map((doc) => (
          <SourceItem
            key={doc.id}
            onMouseEnter={() => handleMouseEnter(doc)}
            onMouseLeave={handleMouseLeave}
          >
            <SourceName>{doc.title}</SourceName>
            {doc.pages && <SourcePages>{doc.pages}</SourcePages>}

            <SourceLink
              href={doc.link}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              원문 링크 이동
            </SourceLink>

            {hoveredDoc && hoveredDoc.id === doc.id && (
              <PreviewIframe src={doc.link} isVisible={true} title="preview" />
            )}
          </SourceItem>
        ))}
      </SourceContent>
    </SourceContainer>
  );
}

export default SourceSidebar;

const SourceContainer = styled.div`
  width: 300px;
  height: 100%;
  background-color: #f8fafc;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
`;

const SourceContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
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
    font-weight: 600;
  }
`;

const SourceName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin: 0 5px 8px 5px;
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
  }
`;

const PreviewIframe = styled.iframe`
  position: absolute;
  top: 100%;
  left: -10px;
  width: 280px;
  height: 200px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;
