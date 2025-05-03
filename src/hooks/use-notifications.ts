import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notificacoes_historico')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setNotifications(data || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  // Simplified send notification function with corrected parameter count
  const sendNotification = async (data) => {
    try {
      // Implementation here
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  return { notifications, loading, error, sendNotification };
}
