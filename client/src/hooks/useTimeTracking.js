import { useState, useEffect, useRef } from "react";
import useApi from "./useApi";

/**
 * Custom hook for tracking time on hourly projects
 *
 * @param {string} projectId - The ID of the project
 * @returns {Object} Time tracking methods and state
 */
const useTimeTracking = (projectId) => {
  const { post, get } = useApi();
  const [isTracking, setIsTracking] = useState(false);
  const [timeTracking, setTimeTracking] = useState({
    totalSeconds: 0,
    sessions: [],
  });
  const [currentSession, setCurrentSession] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load existing time tracking data
  useEffect(() => {
    const fetchTimeTracking = async () => {
      try {
        // Fetch time tracking data from the API
        const response = await get(`/projects/${projectId}/time-tracking`);

        if (response.success && response.data && response.data.timeTracking) {
          const timeTrackingData = response.data.timeTracking;
          setTimeTracking({
            totalSeconds: timeTrackingData.totalSeconds || 0,
            sessions: timeTrackingData.sessions || [],
          });
        }
      } catch (error) {
        console.error("Error fetching time tracking data:", error);
        // Fallback to localStorage if API fails
        try {
          const storedData = localStorage.getItem(`timeTracking_${projectId}`);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setTimeTracking(parsedData);
          }
        } catch (localError) {
          console.error("Error fetching from localStorage:", localError);
        }
      }
    };

    if (projectId) {
      fetchTimeTracking();
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [projectId, get]);

  // Save time tracking data
  const saveTimeTracking = async (data) => {
    try {
      // Save to API
      if (data.sessions && data.sessions.length > 0) {
        // Get the latest session
        const latestSession = data.sessions[0];

        // Send the session to the API
        await post(`/projects/${projectId}/time-tracking`, {
          startTime: latestSession.startTime,
          endTime: latestSession.endTime,
          duration: latestSession.duration,
          notes: latestSession.notes || "",
        });
      }

      // Also save to localStorage as a backup
      localStorage.setItem(`timeTracking_${projectId}`, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving time tracking data:", error);
      // If API fails, at least save to localStorage
      localStorage.setItem(`timeTracking_${projectId}`, JSON.stringify(data));
    }
  };

  // Start time tracking
  const startTracking = () => {
    if (isTracking) return;

    const now = new Date();
    startTimeRef.current = now;

    setCurrentSession({
      startTime: now,
      duration: 0,
    });

    setIsTracking(true);

    // Start timer to update duration every second
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((new Date() - startTimeRef.current) / 1000);

      setCurrentSession((prev) => ({
        ...prev,
        duration: elapsed,
      }));
    }, 1000);
  };

  // Stop time tracking
  const stopTracking = async () => {
    if (!isTracking) return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate final duration
    const endTime = new Date();
    const duration = Math.floor((endTime - startTimeRef.current) / 1000);

    // Create completed session
    const completedSession = {
      startTime: startTimeRef.current,
      endTime: endTime,
      duration: duration,
    };

    // Update time tracking data
    const updatedTimeTracking = {
      totalSeconds: timeTracking.totalSeconds + duration,
      sessions: [completedSession, ...timeTracking.sessions],
    };

    // Save updated data
    setTimeTracking(updatedTimeTracking);
    await saveTimeTracking(updatedTimeTracking);

    // Reset current session
    setCurrentSession(null);
    setIsTracking(false);
  };

  return {
    isTracking,
    timeTracking,
    currentSession,
    startTracking,
    stopTracking,
  };
};

export default useTimeTracking;
