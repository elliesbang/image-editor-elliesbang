import React from "react";

function Header({ onLoginClick }) {
  return (
    <header className="header">
      <div className="header-left">이미지 에디터</div>
      <div className="header-right">
        <button className="header-button" onClick={onLoginClick}>로그인</button>
        <button className="header-button">업그레이드</button>
      </div>
    </header>
  );
}

export default Header;
