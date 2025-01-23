import React from "react";
import styled from "styled-components";

function NavBar({ handleReset }) {
  return (
    <Nav>
      <BlueText onClick={handleReset}>
        🔎<GrayText>CS </GrayText>Agent
      </BlueText>
    </Nav>
  );
}

export default NavBar;

const Nav = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 65px;
  padding: 0 32px;
  font-size: 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-left: 80px;
`;

const GrayText = styled.span`
  color: #64748b;
`;

const BlueText = styled.span`
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
`;
