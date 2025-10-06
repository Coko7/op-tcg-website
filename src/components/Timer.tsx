import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  targetTime: Date | string | null;
  onComplete?: () => void;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ targetTime, onComplete, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      // Convertir targetTime en Date si c'est une string
      const targetDate = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(0);
        onComplete?.();
        return;
      }

      setTimeLeft(difference);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (timeLeft <= 0 || !targetTime) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock size={16} className="text-blue-300" />
      <span className="text-white font-mono text-sm">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default Timer;