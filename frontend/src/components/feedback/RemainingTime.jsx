import React, { useEffect, useState } from 'react';

export const getRemainingSeconds = (estimatedCompletionAt) => {
  if (!estimatedCompletionAt) return 0;
  return Math.max(0, Math.ceil((new Date(estimatedCompletionAt).getTime() - Date.now()) / 1000));
};

export const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};

const RemainingTime = ({ estimatedCompletionAt }) => {
  const [seconds, setSeconds] = useState(() => getRemainingSeconds(estimatedCompletionAt));

  useEffect(() => {
    setSeconds(getRemainingSeconds(estimatedCompletionAt));
    const interval = window.setInterval(() => setSeconds(getRemainingSeconds(estimatedCompletionAt)), 1000);
    return () => window.clearInterval(interval);
  }, [estimatedCompletionAt]);

  if (!estimatedCompletionAt) return null;
  return <span>{seconds > 0 ? formatTime(seconds) : 'Concluindo...'}</span>;
};

export default RemainingTime;
