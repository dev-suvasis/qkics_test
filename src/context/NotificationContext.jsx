import { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../components/utils/axiosSecure";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const user = useSelector((state) => state.user?.data);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async (isRefresh = false, isBackground = false) => {
        if (!user) return;

        if (!isBackground) {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
        }

        try {
            const res = await axiosSecure.get("/v1/notifications/", {
                params: {
                    channel: "IN_APP",
                    limit: 20,
                },
            });

            // FIX: API returns { success, data: { notifications, unreadCount, totalCount } }
            const data = res.data?.data;

            setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
            setUnreadCount(data?.unreadCount || 0);
            setTotalCount(data?.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            if (!isBackground) {
                if (isRefresh) setRefreshing(false);
                else setLoading(false);
            }
        }
    };

    // useEffect(() => {
    //     let intervalId;
    //     if (user) {
    //         fetchNotifications();

    //         // Poll for notifications every 10 seconds in the background
    //         intervalId = setInterval(() => {
    //             fetchNotifications(false, true);
    //         }, 10000);
    //     } else {
    //         setNotifications([]);
    //         setUnreadCount(0);
    //         setTotalCount(0);
    //     }

    //     return () => {
    //         if (intervalId) clearInterval(intervalId);
    //     };
    // }, [user]);

    const markAsRead = async (id, isAlreadyRead) => {
        if (isAlreadyRead) return;

        // FIX: use _id (from API) instead of id
        setNotifications((prev) =>
            prev.map((notif) =>
                notif._id === id ? { ...notif, readAt: new Date().toISOString() } : notif
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await axiosSecure.post(`/v1/notifications/${id}/read/`);
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
            fetchNotifications();
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                totalCount,
                loading,
                refreshing,
                fetchNotifications,
                markAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};