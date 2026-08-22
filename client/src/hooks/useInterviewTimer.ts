import { useEffect, useState } from 'react';

import type { Interview } from './useInterviewSession';

interface UseInterviewTimerProps {
  interview: Interview | null;
  onExpire: () => void;
}

export const useInterviewTimer = ({ interview, onExpire }: UseInterviewTimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!interview || !interview.startedAt || !interview.durationMinutes) return;

    const calculateTimeLeft = () => {
      const startedAt = new Date(interview.startedAt).getTime();
      const totalAllowedMs = interview.durationMinutes * 60 * 1000;
      const elapsed = Date.now() - startedAt - (interview.pausedDurationMs || 0);
      const remainingMs = Math.max(0, totalAllowedMs - elapsed);
      return Math.floor(remainingMs / 1000);
    };

    setRemainingSeconds(calculateTimeLeft());

    const timerInterval = window.setInterval(() => {
      const nextRemainingSeconds = calculateTimeLeft();
      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds <= 0) {
        window.clearInterval(timerInterval);
        onExpire();
      }
    }, 1000);

    return () => window.clearInterval(timerInterval);
  }, [interview, onExpire]);

  const formatTime = (totalSeconds: number | null) => {
    if (totalSeconds === null) return '--:--';

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isTimerWarning = remainingSeconds !== null && remainingSeconds < 300;
  const isTimerCritical = remainingSeconds !== null && remainingSeconds < 120;

  return {
    remainingSeconds,
    formatTime,
    isTimerWarning,
    isTimerCritical,
  };
};
