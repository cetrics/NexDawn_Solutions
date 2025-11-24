import React, { createContext, useContext, useState, useEffect } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    // ✅ Load dismissed IDs from localStorage so they never reappear
    const saved = localStorage.getItem("dismissedNotifications");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ Persist dismissed notifications
  useEffect(() => {
    localStorage.setItem("dismissedNotifications", JSON.stringify(dismissed));
  }, [dismissed]);

  const addNotification = (notif) => {
    setNotifications((prev) => {
      // 🚫 Skip if already dismissed or already visible
      if (dismissed.includes(notif.id) || prev.some((n) => n.id === notif.id)) {
        return prev;
      }
      return [...prev, notif];
    });
  };

  const removeNotification = (id) => {
    // ✅ Remove from visible notifications
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // ✅ Mark as dismissed forever
    setDismissed((prev) => [...prev, id]);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setDismissed([]); // optional: resets dismissed list
    localStorage.removeItem("dismissedNotifications");
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
