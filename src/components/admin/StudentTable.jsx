import PropTypes from "prop-types";
import { useMemo } from "react";

const StudentTable = ({ type, data, loading, searchTerm, onSearch }) => {
  const sortedData = useMemo(() => {
    const items = Array.isArray(data) ? [...data] : [];
    return items.sort((a, b) =>
      (a?.name || "").localeCompare(b?.name || "", "ko", {
        sensitivity: "base",
      })
    );
  }, [data]);

  return (
    <div className="student-table">
      <div className="student-table__controls">
        <input
          type="search"
          className="student-table__search"
          placeholder="이름, 이메일, 상태 등으로 검색"
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="student-table__loading">불러오는 중...</div>
      ) : null}

      {!loading && sortedData.length === 0 ? (
        <div className="student-table__empty">표시할 데이터가 없습니다.</div>
      ) : null}

      {!loading && sortedData.length > 0 ? (
        <table className="student-table__table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>상태</th>
              {type === "student" ? <th>수강중 강의</th> : null}
              {type === "student" ? <th>학습 진척도</th> : null}
              {type === "vod" ? <th>VOD 권한</th> : null}
              {type === "vod" ? <th>구독 정보</th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr key={item.id}>
                <td>{item.name || "-"}</td>
                <td>{item.email || "-"}</td>
                <td>{item.status || "-"}</td>
                {type === "student" ? (
                  <td>{item.enrolledCourses || "-"}</td>
                ) : null}
                {type === "student" ? (
                  <td>{item.progress || "-"}</td>
                ) : null}
                {type === "vod" ? <td>{item.vodAccess || "-"}</td> : null}
                {type === "vod" ? (
                  <td>{item.subscriptionPlan || "-"}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
};

StudentTable.propTypes = {
  type: PropTypes.oneOf(["student", "vod"]).isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      email: PropTypes.string,
      status: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  searchTerm: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
};

StudentTable.defaultProps = {
  data: [],
  loading: false,
};

export default StudentTable;
