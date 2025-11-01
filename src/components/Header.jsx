import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">💛 엘리의방 이미지 에디터</span>
      </div>
      <div className="header-right">
        <button className="btn-login">로그인</button>
        <button className="btn-upgrade">업그레이드</button>
      </div>
    </header>
  );
}
