import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { apiService } from '../services/api';
import NotificationModal from './NotificationModal';

interface Notification {
  id: string;
  title: string;
  message: string;
  reward_berrys: number;
  reward_boosters: number;
  created_at: string;
  expires_at?: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.unread_count || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Rafraîchir toutes les 2 minutes
    const interval = setInterval(fetchNotifications, 120000);

    return () => clearInterval(interval);
  }, []);

  const handleClaimReward = async (notificationId: string) => {
    try {
      const response = await apiService.claimNotification(notificationId);
      if (response.success) {
        // Rafraîchir la liste des notifications
        await fetchNotifications();
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Erreur lors de la réclamation de la notification:', error);
      throw error;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative p-2 text-white hover:text-yellow-300 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        notifications={notifications}
        onClaimReward={handleClaimReward}
        onRefresh={fetchNotifications}
      />
    </>
  );
};

export default NotificationBell;
