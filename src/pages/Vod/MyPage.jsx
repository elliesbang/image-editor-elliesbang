import { useEffect, useMemo, useState } from "react";

function VodFilter({ categories, current, onChange }) {
  return (
    <div className="vod-filter">
      <label htmlFor="vod-category">카테고리</label>
      <select
        id="vod-category"
        value={current}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">전체</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

function VodList({ videos }) {
  if (!videos.length) {
    return <p>해당 조건에 맞는 VOD가 없습니다.</p>;
  }
  return (
    <ul className="vod-list">
      {videos.map((video) => (
        <li key={video.id} className="vod-list__item">
          <div className="vod-list__info">
            <h3>{video.properties?.Title || video.properties?.Name || "VOD"}</h3>
            <p>{video.properties?.Description || video.properties?.소개 || "설명 없음"}</p>
            <span>
              {video.properties?.Category || video.properties?.카테고리 || "분류 없음"}
            </span>
          </div>
          <div className="vod-list__actions">
            <a href={video.properties?.URL || video.properties?.Link || "#"} target="_blank" rel="noreferrer">
              바로 시청
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RecentVod({ videos }) {
  if (!videos.length) {
    return <p>최근 시청 기록이 없습니다.</p>;
  }
  return (
    <ul className="vod-recent-list">
      {videos.map((video) => (
        <li key={video.id} className="vod-recent-list__item">
          <strong>{video.properties?.Title || video.properties?.Name || "VOD"}</strong>
          <span>{new Date(video.lastEditedTime || video.createdTime).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}

export default function VodMyPage({ user }) {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/.netlify/functions/vod")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVideos(data.videos || []);
          setFilteredVideos(data.videos || []);
        } else {
          setError(data.error || "VOD 정보를 불러오지 못했습니다.");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (category === "all") {
      setFilteredVideos(videos);
      return;
    }
    const nextVideos = videos.filter((video) => {
      const categoryValue =
        video.properties?.Category || video.properties?.카테고리 || video.properties?.Type;
      if (!categoryValue) {
        return false;
      }
      if (Array.isArray(categoryValue)) {
        return categoryValue.some((value) => String(value).toLowerCase() === category.toLowerCase());
      }
      return String(categoryValue).toLowerCase() === category.toLowerCase();
    });
    setFilteredVideos(nextVideos);
  }, [category, videos]);

  const categories = useMemo(() => {
    const set = new Set();
    videos.forEach((video) => {
      const categoryValue =
        video.properties?.Category || video.properties?.카테고리 || video.properties?.Type;
      if (!categoryValue) {
        return;
      }
      if (Array.isArray(categoryValue)) {
        categoryValue.forEach((value) => set.add(String(value)));
      } else {
        set.add(String(categoryValue));
      }
    });
    return Array.from(set);
  }, [videos]);

  const recentVideos = useMemo(() => {
    return [...videos]
      .sort((a, b) => new Date(b.lastEditedTime) - new Date(a.lastEditedTime))
      .slice(0, 5);
  }, [videos]);

  const vodUserName =
    user?.properties?.Name || user?.properties?.이름 || user?.name || user?.email || "VOD 담당자";

  if (loading) {
    return (
      <div className="vod-dashboard vod-dashboard--loading">
        <p>VOD 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vod-dashboard vod-dashboard--error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="vod-dashboard">
      <header className="vod-dashboard__header">
        <h1>{vodUserName}님을 위한 VOD 센터</h1>
      </header>

      <VodFilter categories={categories} current={category} onChange={setCategory} />

      <section className="vod-section">
        <h2>VOD 강의 목록</h2>
        <VodList videos={filteredVideos} />
      </section>

      <section className="vod-section">
        <h2>최근 시청한 VOD</h2>
        <RecentVod videos={recentVideos} />
      </section>
    </div>
  );
}
