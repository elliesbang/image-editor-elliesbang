import { useEffect, useMemo, useState } from "react";

function Section({ title, children, action }) {
  return (
    <section className="student-section">
      <header className="student-section__header">
        <h2>{title}</h2>
        {action}
      </header>
      <div className="student-section__content">{children}</div>
    </section>
  );
}

function ClassroomList({ classrooms }) {
  if (!classrooms.length) {
    return <p>등록된 수업이 없습니다.</p>;
  }
  return (
    <ul className="student-list">
      {classrooms.map((classroom) => (
        <li key={classroom.id} className="student-list__item">
          <h3>{classroom.properties?.Title || classroom.properties?.Name || "수업"}</h3>
          <p>{classroom.properties?.Description || classroom.properties?.소개 || "설명 없음"}</p>
        </li>
      ))}
    </ul>
  );
}

function AssignmentList({ assignments, feedbacks }) {
  if (!assignments.length) {
    return <p>제출된 과제가 없습니다.</p>;
  }

  const feedbackMap = new Map();
  feedbacks.forEach((feedback) => {
    const relations =
      feedback.properties?.Assignment ||
      feedback.properties?.Submission ||
      feedback.properties?.과제 ||
      [];
    const relationIds = Array.isArray(relations) ? relations : [relations];
    relationIds.forEach((relationId) => {
      if (relationId) {
        feedbackMap.set(relationId, feedback);
      }
    });
  });

  return (
    <ul className="student-list">
      {assignments.map((assignment) => {
        const feedback = feedbackMap.get(assignment.id);
        return (
          <li key={assignment.id} className="student-list__item">
            <h3>{assignment.properties?.Title || assignment.properties?.Name || "과제"}</h3>
            <p>제출 링크: {assignment.properties?.Link || assignment.properties?.URL || assignment.properties?.Submission}</p>
            <p>주차: {assignment.properties?.Week ?? assignment.properties?.주차 ?? "미정"}</p>
            <p>상태: {feedback ? "피드백 완료" : "피드백 대기"}</p>
          </li>
        );
      })}
    </ul>
  );
}

function FeedbackList({ feedbacks }) {
  if (!feedbacks.length) {
    return <p>받은 피드백이 없습니다.</p>;
  }
  return (
    <ul className="student-list">
      {feedbacks.map((feedback) => (
        <li key={feedback.id} className="student-list__item">
          <h3>{feedback.properties?.Title || feedback.properties?.Name || "피드백"}</h3>
          <p>{feedback.properties?.Feedback || feedback.properties?.Content || feedback.properties?.Body}</p>
          <span>{new Date(feedback.createdTime).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}

function UpcomingLessons({ lessons }) {
  if (!lessons.length) {
    return <p>예정된 수업이 없습니다.</p>;
  }
  return (
    <ul className="student-list">
      {lessons.map((lesson) => (
        <li key={lesson.id} className="student-list__item">
          <h3>{lesson.properties?.Title || lesson.properties?.Name || "수업"}</h3>
          <p>{lesson.properties?.Description || lesson.properties?.소개 || "내용 없음"}</p>
          <span>
            {lesson.schedule
              ? new Date(lesson.schedule).toLocaleString()
              : "일정 정보 없음"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function StudentMyPage({ user }) {
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const studentName = useMemo(() => {
    return (
      user?.properties?.Name ||
      user?.properties?.Student ||
      user?.properties?.학생 ||
      user?.name ||
      user?.email ||
      ""
    );
  }, [user]);

  useEffect(() => {
    if (!studentName) {
      setLoading(false);
      setError("학생 정보를 확인할 수 없습니다.");
      return;
    }

    setLoading(true);
    const encodedName = encodeURIComponent(studentName);

    Promise.all([
      fetch(`/.netlify/functions/classroom?studentName=${encodedName}`).then((res) => res.json()),
      fetch(`/.netlify/functions/assignment-submit?student=${encodedName}`).then((res) => res.json()),
      fetch(`/.netlify/functions/feedback?student=${encodedName}`).then((res) => res.json()),
      fetch(`/.netlify/functions/course`).then((res) => res.json()),
    ])
      .then(([classroomData, assignmentData, feedbackData, courseData]) => {
        if (classroomData.success) {
          setClassrooms(classroomData.classrooms || []);
        } else {
          setError(classroomData.error || "수업 정보를 불러오지 못했습니다.");
        }

        if (assignmentData.success) {
          setAssignments(assignmentData.assignments || []);
        }

        if (feedbackData.success) {
          setFeedbacks(feedbackData.feedbacks || []);
        }

        if (courseData.success) {
          setCourses(courseData.courses || []);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentName]);

  const upcomingLessons = useMemo(() => {
    if (!courses.length) {
      return [];
    }
    return courses
      .map((course) => {
        const schedule =
          course.properties?.Schedule ||
          course.properties?.Date ||
          course.properties?.일정 ||
          course.properties?.Time;
        const scheduleDate =
          typeof schedule === "object" && schedule?.start ? schedule.start : schedule;
        return { ...course, schedule: scheduleDate };
      })
      .sort((a, b) => {
        const aTime = a.schedule ? new Date(a.schedule).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.schedule ? new Date(b.schedule).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 3);
  }, [courses]);

  if (loading) {
    return (
      <div className="student-dashboard student-dashboard--loading">
        <p>나의 학습 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard student-dashboard--error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="student-dashboard__header">
        <h1>{studentName}님의 학습 현황</h1>
        <button type="button" className="student-upload-button">
          과제 업로드
        </button>
      </header>

      <Section title="등록된 수업">
        <ClassroomList classrooms={classrooms} />
      </Section>

      <Section title="나의 과제 제출 현황">
        <AssignmentList assignments={assignments} feedbacks={feedbacks} />
      </Section>

      <Section title="내 피드백 현황">
        <FeedbackList feedbacks={feedbacks} />
      </Section>

      <Section title="이번 주 수업 보기">
        <UpcomingLessons lessons={upcomingLessons} />
      </Section>
    </div>
  );
}
