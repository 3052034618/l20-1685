import React from 'react';
import { View, Text } from '@tarojs/components';
import { TransactionRecord } from '@/types';
import styles from './index.module.scss';

interface TransactionItemProps {
  record: TransactionRecord;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60 * 1000) {
    return '刚刚';
  }
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ record }) => {
  const isReward = record.type === 'reward';

  return (
    <View className={styles.item}>
      <View className={styles.left}>
        <View className={`${styles.icon} ${isReward ? styles.rewardIcon : styles.consumeIcon}`}>
          <Text className={styles.iconText}>{isReward ? '+' : '-'}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.title}>{record.description}</Text>
          <Text className={styles.time}>{formatTime(record.createdAt)}</Text>
          {(record.taskCoinUsed || record.balanceUsed) && record.taskCoinUsed + record.balanceUsed > 0 && (
            <View className={styles.breakdown}>
              {record.taskCoinUsed && record.taskCoinUsed > 0 && (
                <Text className={styles.breakdownItem}>
                  任务书币 {record.taskCoinUsed > 0 ? '-' : ''}{record.taskCoinUsed}
                </Text>
              )}
              {record.balanceUsed && record.balanceUsed > 0 && (
                <Text className={styles.breakdownItem}>
                  余额 {record.balanceUsed > 0 ? '-' : ''}{record.balanceUsed}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
      <View className={styles.right}>
        <Text className={`${styles.amount} ${isReward ? styles.rewardAmount : styles.consumeAmount}`}>
          {isReward ? '+' : '-'}{record.amount}
        </Text>
        <Text className={styles.coinLabel}>书币</Text>
      </View>
    </View>
  );
};

export default TransactionItem;
