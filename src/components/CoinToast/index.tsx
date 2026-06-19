import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface CoinToastProps {
  visible: boolean;
  amount: number;
  message?: string;
  onClose?: () => void;
  duration?: number;
}

const CoinToast: React.FC<CoinToastProps> = ({
  visible,
  amount,
  message = '书币已到账',
  onClose,
  duration = 2000,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration, onClose]);

  if (!show) return null;

  console.log('[CoinToast] Showing toast for amount:', amount);

  return (
    <View className={styles.toastContainer}>
      <View className={styles.toastContent}>
        <View className={styles.sparkles}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              className={styles.sparkle}
              style={{
                // @ts-ignore
                '--tx': `${(Math.random() - 0.5) * 100}rpx`,
                '--ty': `${(Math.random() - 0.5) * 100}rpx`,
              }}
            />
          ))}
        </View>
        <Text className={styles.coinEmoji}>🪙</Text>
        <Text className={styles.coinAmount}>+{amount}</Text>
        <Text className={styles.toastText}>{message}</Text>
      </View>
    </View>
  );
};

export default CoinToast;
