import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for tracking recording duration with timer display
 * @param {number} [maxDuration] - Optional max duration in seconds (auto-stops via callback)
 * @returns {{ recordingTime, startTimer, stopTimer, getDuration, formatTime }}
 */
export function useRecordingTimer(maxDuration) {
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  const startTimer = useCallback((onMaxReached) => {
    startTimeRef.current = Date.now();
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setRecordingTime(elapsed);
      if (maxDuration && elapsed >= maxDuration && onMaxReached) {
        onMaxReached();
      }
    }, 250);
  }, [maxDuration]);

  const getDuration = useCallback(() => {
    return startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : recordingTime;
  }, [recordingTime]);

  const formatTime = useCallback((seconds) => {
    const s = typeof seconds === 'number' ? seconds : recordingTime;
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }, [recordingTime]);

  const secondsLeft = maxDuration ? Math.max(0, maxDuration - recordingTime) : null;

  return { recordingTime, secondsLeft, startTimer, stopTimer, getDuration, formatTime };
}
