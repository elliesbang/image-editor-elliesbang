import React, { useMemo } from "react";
import classes from "../data/classData";
import ClassroomListItem from "../components/ClassroomListItem";

const ACCORDION_SECTIONS = [
  { key: "skill", title: "스킬" },
  { key: "money", title: "수익화" },
  { key: "ai", title: "AI 창작" },
];

const Classroom = () => {
  const categorizedClasses = useMemo(
    () => ({
      skill: classes.filter(
        ({ category, hidden }) => category === "skill" && hidden !== true
      ),
      money: classes.filter(
        ({ category, hidden }) => category === "money" && hidden !== true
      ),
      ai: classes.filter(
        ({ category, hidden }) => category === "ai" && hidden !== true
      ),
    }),
    []
  );

  return (
    <div className="classroom-page">
      <header className="classroom-hero">
        <h1>Interactive Classroom</h1>
        <p>
          Build community, share knowledge, and stay aligned on coursework with
          a structured learning space.
        </p>
      </header>

      <main className="classroom-layout">
        <section className="classroom-overview">
          <h2>Course Overview</h2>
          <p>
            This classroom hub centralizes announcements, weekly tasks, and
            progress insights so everyone can stay on track.
          </p>
          <ul className="classroom-highlights">
            <li>Weekly summaries and reminders</li>
            <li>Project checkpoints and rubrics</li>
            <li>Student collaboration spaces</li>
          </ul>
        </section>

        <section className="classroom-accordion">
          {ACCORDION_SECTIONS.map(({ key, title }) => (
            <article
              key={key}
              className={`classroom-accordion__panel classroom-accordion__panel--${key}`}
            >
              <header className="classroom-accordion__header">
                <h2>{title}</h2>
              </header>
              <ul className="classroom-accordion__list">
                {categorizedClasses[key].map((classItem) => (
                  <ClassroomListItem key={classItem.id} classInfo={classItem} />
                ))}
              </ul>
            </article>
          ))}
        </section>

        <aside className="classroom-sidebar">
          <h2>Resources</h2>
          <div className="classroom-resource-card">
            <h3>Office Hours</h3>
            <p>Schedule time with instructors for guidance on assignments.</p>
          </div>
          <div className="classroom-resource-card">
            <h3>Community Forum</h3>
            <p>Join topic threads to discuss ideas and share feedback.</p>
          </div>
          <div className="classroom-resource-card">
            <h3>Support Center</h3>
            <p>Access help articles and contact information for assistance.</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Classroom;
