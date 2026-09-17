import { Button } from 'antd';
import { useEffect, useState } from 'react';

interface CaptchaButtonProps {
  loading?: boolean;
  expireSeconds?: number;
  onClick: () => Promise<unknown>;
}

export function CaptchaButton({ loading, expireSeconds = 60, onClick }: CaptchaButtonProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!seconds) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSeconds((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [seconds]);

  const handleClick = async () => {
    await onClick();
    setSeconds(expireSeconds);
  };

  return (
    <Button disabled={seconds > 0} loading={loading} onClick={handleClick}>
      {seconds > 0 ? `${seconds}s` : '获取验证码'}
    </Button>
  );
}
