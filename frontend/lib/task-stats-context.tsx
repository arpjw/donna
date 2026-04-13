"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface TaskStatsContextValue {
  refreshKey: number;
  triggerRefresh: () => void;
}

const TaskStatsContext = createContext<TaskStatsContextValue>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function useTaskStats() {
  return useContext(TaskStatsContext);
}

export function TaskStatsProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <TaskStatsContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </TaskStatsContext.Provider>
  );
}
