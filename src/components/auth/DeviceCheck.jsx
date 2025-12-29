import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function DeviceCheck() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    staleTime: 300000,
  });

  useEffect(() => {
    const checkDevice = async () => {
      if (!user) return;
      
      // Check if device check has been done this session
      const lastCheck = sessionStorage.getItem('device_check_done');
      if (lastCheck) return;

      try {
        await base44.functions.invoke('checkDeviceLogin', {});
        sessionStorage.setItem('device_check_done', 'true');
      } catch (error) {
        console.error('Device check failed:', error);
      }
    };

    checkDevice();
  }, [user]);

  return null;
}