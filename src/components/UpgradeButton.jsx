import React from "react";

export default function UpgradeButton({ onClick }) {
  return (
    <button className="header-button" onClick={onClick}>
      업그레이드
    </button>
  );
}
