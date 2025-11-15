import { useCallback, useEffect, useMemo, useState } from "react";
import StudentTable from "../../components/admin/StudentTable";
import { getStudents, getVODStudents } from "../../api/notion/getStudents";

const TAB_TYPES = {
  STUDENT: "student",
  VOD: "vod",
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [vodStudents, setVodStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(TAB_TYPES.STUDENT);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [studentResponse, vodResponse] = await Promise.all([
          getStudents(),
          getVODStudents(),
        ]);

        if (!isMounted) return;

        setStudents(studentResponse);
        setVodStudents(vodResponse);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = useCallback((type) => {
    setActiveTab(type);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filterByTerm = (records, type) =>
      records.filter((record) => {
        if (!term) return true;
        const baseFields = [record.name, record.email, record.status];
        const specificFields =
          type === TAB_TYPES.STUDENT
            ? [record.enrolledCourses, record.progress]
            : [record.vodAccess, record.subscriptionPlan];

        return [...baseFields, ...specificFields]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(term)
          );
      });

    return {
      [TAB_TYPES.STUDENT]: filterByTerm(students, TAB_TYPES.STUDENT),
      [TAB_TYPES.VOD]: filterByTerm(vodStudents, TAB_TYPES.VOD),
    };
  }, [searchTerm, students, vodStudents]);

  const tableData = activeTab === TAB_TYPES.STUDENT
    ? filteredStudents[TAB_TYPES.STUDENT]
    : filteredStudents[TAB_TYPES.VOD];

  return (
    <div className="student-management">
      <header className="student-management__header">
        <h1>수강생 관리</h1>
        <div className="student-management__tabs">
          <button
            type="button"
            className={`student-management__tab-button ${
              activeTab === TAB_TYPES.STUDENT ? "is-active" : ""
            }`}
            onClick={() => handleTabChange(TAB_TYPES.STUDENT)}
          >
            수강생
          </button>
          <button
            type="button"
            className={`student-management__tab-button ${
              activeTab === TAB_TYPES.VOD ? "is-active" : ""
            }`}
            onClick={() => handleTabChange(TAB_TYPES.VOD)}
          >
            VOD
          </button>
        </div>
      </header>

      {error ? (
        <div className="student-management__error">{error}</div>
      ) : null}

      <StudentTable
        type={activeTab}
        data={tableData}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default StudentManagement;
