import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export const usePusher = () => {
  const [pusher, setPusher] = useState<Pusher | null>(null);

  useEffect(() => {
    // Initialize Pusher
    const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
    });

    setPusher(pusherInstance);

    // Cleanup on unmount
    return () => {
      pusherInstance.disconnect();
    };
  }, []);

  return pusher;
};
