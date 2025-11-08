import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

const CACHE_DURATION = 3600 * 1000; // 1 giờ

export function useJobData() {
  const [allJobs, setAllJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dataUrl = '/data.csv';
    const now = new Date().getTime();
    const cachedData = localStorage.getItem("cachedJobs");
    const cacheTime = localStorage.getItem("cachedJobsTime");

    if (cachedData && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
      setAllJobs(JSON.parse(cachedData));
      setIsLoading(false);
    } else {
      Papa.parse(dataUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const sortedData = results.data.sort((a, b) => {
            const dateTimeA = new Date(`${a.Ngay} ${a.ThoiGianBatDau}`);
            const dateTimeB = new Date(`${b.Ngay} ${b.ThoiGianBatDau}`);
            return dateTimeA - dateTimeB;
          });
          setAllJobs(sortedData);
          setIsLoading(false);
          localStorage.setItem("cachedJobs", JSON.stringify(sortedData));
          localStorage.setItem("cachedJobsTime", now.toString());
        },
        error: (err) => {
          console.error("Lỗi khi tải và đọc file CSV:", err);
          setIsLoading(false);
        }
      });
    }
  }, []);

  const uniqueDates = useMemo(() => {
    const dates = allJobs.map(job => job.Ngay);
    return [...new Set(dates)];
  }, [allJobs]);

  return { jobs: allJobs, isLoading, uniqueDates };
}