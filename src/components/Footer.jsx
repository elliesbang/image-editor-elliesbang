import React, { useState } from "react";
import "./Footer.css";

export default function Footer() {
  const [modal, setModal] = useState(null);

  const contents = {
    terms: `
    <h3>이용약관</h3>
    <p>본 서비스는 엘리의방(Ellie’s Bang)에서 제공하며, 사용자는 본 약관에 동의함으로써 서비스를 이용할 수 있습니다. 
    사용자는 타인의 저작권을 침해하거나 불법적인 이미지를 업로드해서는 안 됩니다.</p>
    <p>서비스의 이용에 따른 문제 발생 시, 당사는 관련 법령에 따른 책임을 집니다.</p>`,

    privacy: `
    <h3>개인정보처리방침</h3>
    <p>엘리의방은 이용자의 개인정보를 소중히 다루며, 서비스 제공 목적 외의 용도로 사용하지 않습니다. 
    수집된 정보는 회원 관리, 고객 문의 응대, 서비스 개선을 위한 통계 목적으로만 활용됩니다.</p>
    <p>사용자는 언제든지 개인정보 열람 및 삭제를 요청할 수 있습니다.</p>`,

    cookie: `
    <h3>쿠키 정책</h3>
    <p>본 사이트는 사용자 편의를 위해 쿠키를 사용합니다. 쿠키는 서비스 향상과 방문 분석을 위해 활용되며, 
    브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.</p>`,
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">
          💛 <strong>엘리의방</strong> 이미지 에디터
        </div>

        <div className="footer-links">
          <button onClick={() => setModal("terms")}>이용약관</button>
          <button onClick={() => setModal("privacy")}>개인정보처리방침</button>
          <button onClick={() => setModal("cookie")}>쿠키 정책</button>
        </div>

        <p className="footer-text">
          ⓒ 2025 <strong>엘리의방 (Ellie’s Bang)</strong>. All rights reserved. <br />
          Designed & Developed by <strong>Ellie Studio</strong>
        </p>
      </div>

      {/* ✅ 모달창 */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}>
              닫기 ✕
            </button>
            <div
              className="modal-body"
              dangerouslySetInnerHTML={{ __html: contents[modal] }}
            />
          </div>
        </div>
      )}
    </footer>
  );
}
