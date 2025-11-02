import React from "react";

function LoginModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">로그인</div>
        <div className="modal-actions">
          <button className="btn-wide">Google 로그인</button>
          <button className="btn-wide">미치나 로그인</button>
          <button className="btn-wide">관리자 로그인</button>
        </div>
        <button className="modal-close" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

export default LoginModal;
