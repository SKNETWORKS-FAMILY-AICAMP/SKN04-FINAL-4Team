import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { FaUser, FaLock } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    // 관리자 계정 확인
    if (formData.email === "admin@admin.com" && formData.password === "admin00") {
      navigate("/");
    } else {
      setError("일치하는 계정이 없습니다.");
    }
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <LoginBox>
          <Title>Login</Title>
          <Form onSubmit={handleSubmit}>
            <InputWrapper>
              <FaUser className="icon" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="사내 이메일을 입력하세요"
              />
            </InputWrapper>

            <InputWrapper>
              <FaLock className="icon" />
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
              />
            </InputWrapper>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <LoginButton type="submit">
              로그인
            </LoginButton>
          </Form>
        </LoginBox>
      </Container>
    </>
  );
};

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
  }
`;

const Container = styled.div`
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
`;

const LoginBox = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 0 0 20px 0;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 50px;
  color: #2563eb;
  font-weight: 600;
  text-align: center;
  margin-bottom: 50px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;

  .icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9CA3AF;
  }
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 40px;
  font-size: 15px;
  color: #334155;
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    background-color: #ffffff;
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const ErrorMessage = styled.div`
  color: #EF4444;
  font-size: 0.875rem;
  margin-top: 20px;
`;

const LoginButton = styled.button`
  width: 100%;
  height: 48px;
  padding: 0;
  margin-top: 20px;
  font-size: 15px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #1d4ed8;
  }
`;

export default Login;
