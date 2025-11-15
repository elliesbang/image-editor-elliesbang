import { useEffect, useMemo, useState } from "react";

function Section({ title, children, action }) {
  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <h2>{title}</h2>
        {action}
      </header>
      <div className="admin-section__content">{children}</div>
    </section>
  );
}

function QuickActions() {
  return (
    <div className="admin-quick-actions">
      <button type="button">콘텐츠 관리</button>
      <button type="button">수업 추가</button>
      <button type="button">학습 현황</button>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="admin-metric">
      <span className="admin-metric__label">{label}</span>
      <strong className="admin-metric__value">{value}</strong>
    </div>
  );
}

export default function AdminMyPage({ user }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDashboard(data);
        } else {
          setError(data.error || "관리자 데이터를 불러오지 못했습니다.");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const metrics = dashboard?.metrics || {};
  const ongoingClassrooms = dashboard?.classrooms?.ongoing || [];
  const feedbacks = dashboard?.feedbacks || [];
  const activityLogs = dashboard?.recentActivities || [];

  const feedbackSummary = useMemo(() => {
    if (!feedbacks.length) {
      return [];
    }
    return feedbacks.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.properties?.Title || item.properties?.Name || "피드백",
      reviewer: item.properties?.Reviewer || item.properties?.Admin || item.properties?.Author,
      createdAt: item.createdTime,
    }));
  }, [feedbacks]);

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <p>대시보드를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard admin-dashboard--error">
        <p>{error}</p>
      </div>
    );
  }

  const adminName =
    user?.properties?.Name ||
    user?.properties?.이름 ||
    user?.name ||
    user?.email ||
    "관리자";

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>{adminName}님, 환영합니다!</h1>
        <QuickActions />
      </header>

      <Section title="핵심 지표">
        <div className="admin-metrics-grid">
          <MetricCard label="전체 피드백" value={metrics.totalFeedback ?? 0} />
          <MetricCard label="대기 피드백" value={metrics.pendingFeedback ?? 0} />
          <MetricCard label="이번 주 피드백" value={metrics.thisWeekFeedback ?? 0} />
          <MetricCard label="진행 중 수업" value={metrics.ongoingClassCount ?? 0} />
        </div>
      </Section>

      <Section title="진행 중인 수업">
        <ul className="admin-list">
          {ongoingClassrooms.map((classroom) => (
            <li key={classroom.id} className="admin-list__item">
              <h3>{classroom.properties?.Title || classroom.properties?.Name || "수업"}</h3>
              <p>{classroom.properties?.Description || classroom.properties?.소개 || "설명 없음"}</p>
            </li>
          ))}
          {ongoingClassrooms.length === 0 && <li>진행 중인 수업이 없습니다.</li>}
        </ul>
      </Section>

      <Section title="피드백 현황">
        <ul className="admin-list">
          {feedbackSummary.map((feedback) => (
            <li key={feedback.id} className="admin-list__item">
              <h3>{feedback.title}</h3>
              <p>검토자: {feedback.reviewer || "미지정"}</p>
              <span>{new Date(feedback.createdAt).toLocaleString()}</span>
            </li>
          ))}
          {feedbackSummary.length === 0 && <li>등록된 피드백이 없습니다.</li>}
        </ul>
      </Section>

      <Section title="최근 활동">
        <ul className="admin-list">
          {activityLogs.map((log) => (
            <li key={log.id} className="admin-list__item">
              <h3>{log.properties?.Title || log.properties?.Action || "활동"}</h3>
              <p>{log.properties?.Details || log.properties?.Description || log.properties?.Notes || "내용 없음"}</p>
              <span>{new Date(log.createdTime).toLocaleString()}</span>
            </li>
          ))}
          {activityLogs.length === 0 && <li>활동 로그가 없습니다.</li>}
        </ul>
      </Section>
    </div>
  );
}
