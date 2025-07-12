'use client';

import { useEffect, useState } from 'react';

interface ClientDateProps {
  format?: 'full' | 'date' | 'time';
  className?: string;
}

export default function ClientDate({ format = 'full', className }: ClientDateProps) {
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    let formatted = '';

    switch (format) {
      case 'full':
        formatted = now.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        });
        break;
      case 'date':
        formatted = now.toLocaleDateString('ko-KR');
        break;
      case 'time':
        formatted = now.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' });
        break;
    }

    setDate(formatted);
  }, [format]);

  if (!date) return null;

  return <span className={className}>{date}</span>;
}