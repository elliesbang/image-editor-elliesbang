import React from "react";

export default function AdminLoginModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">관리자 로그인</div>
        <p className="modal-subtitle">관리자 전용 로그인 창입니다.</p>
        <div className="modal-actions">
          <button className="btn-wide">이메일로 로그인</button>
          <button className="btn-wide">SSO 로그인</button>
        </div>
        <button className="modal-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
