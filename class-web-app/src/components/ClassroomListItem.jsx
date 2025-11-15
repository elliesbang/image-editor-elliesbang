import React from "react";

const ClassroomListItem = (props) => {
  const classInfo =
    props.classInfo || props.classData || props.item || props.course || props;

  if (!classInfo || classInfo.hidden) {
    return null;
  }

  const { id, title, description, badge, link } = classInfo;

  return (
    <li className="classroom-list-item" data-id={id}>
      <div className="classroom-list-item__content">
        <div className="classroom-list-item__text">
          {badge && <span className="classroom-list-item__badge">{badge}</span>}
          <h3 className="classroom-list-item__title">{title}</h3>
          {description && (
            <p className="classroom-list-item__description">{description}</p>
          )}
        </div>
        <a
          className="classroom-list-item__cta"
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          수강하기
        </a>
      </div>
    </li>
  );
};

export default ClassroomListItem;
