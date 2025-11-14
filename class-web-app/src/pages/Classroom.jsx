import React from "react";

const modules = [
  {
    id: 1,
    title: "Introduction to the Classroom",
    description:
      "Kick off the semester with expectations, course goals, and an overview of the tools available to students.",
  },
  {
    id: 2,
    title: "Project Collaboration",
    description:
      "Learn how to collaborate in real time using shared documents, breakout rooms, and peer review workflows.",
  },
  {
    id: 3,
    title: "Assessment & Feedback",
    description:
      "Understand the assessment schedule, grading rubric, and feedback cycles that will guide learning outcomes.",
  },
];

const Classroom = () => {
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

        <section className="classroom-modules">
          <h2>Learning Modules</h2>
          {modules.map((module) => (
            <article key={module.id} className="classroom-module">
              <h3>{module.title}</h3>
              <p>{module.description}</p>
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
