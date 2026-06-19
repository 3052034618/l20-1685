import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import classNames from 'classnames';
import { Chapter } from '@/types';
import { useApp } from '@/store/AppContext';
import styles from './index.module.scss';

interface UnlockModalProps {
  visible: boolean;
  chapter: Chapter | null;
  onCancel: () => void;
  onConfirm: (useTaskCoin: boolean) => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({
  visible,
  chapter,
  onCancel,
  onConfirm,
}) => {
  const { state } = useApp();
  const { balance, taskCoin } = state.user;
  const [useTaskCoin, setUseTaskCoin] = useState(true);

  useEffect(() => {
    if (visible && chapter) {
      const canUseTaskCoin = taskCoin >= chapter.coinRequired;
      const canUseBalance = balance >= chapter.coinRequired;

      if (canUseTaskCoin) {
        setUseTaskCoin(true);
      } else if (canUseBalance) {
        setUseTaskCoin(false);
      }
    }
  }, [visible, chapter, taskCoin, balance]);

  if (!visible || !chapter) return null;

  const canUseTaskCoin = taskCoin >= chapter.coinRequired;
  const canUseBalance = balance >= chapter.coinRequired;
  const canConfirm = canUseTaskCoin || canUseBalance;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(useTaskCoin);
  };

  const handleOptionClick = (isTaskCoin: boolean) => {
    if (isTaskCoin && !canUseTaskCoin) return;
    if (!isTaskCoin && !canUseBalance) return;
    setUseTaskCoin(isTaskCoin);
  };

  return (
    <View className={styles.modalOverlay} onClick={onCancel}>
      <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <View className={styles.modalHeader}>
          <View className={styles.lockIcon}>🔒</View>
          <Text className={styles.modalTitle}>本章为付费内容</Text>
          <Text className={styles.modalSubtitle}>解锁后可阅读全文</Text>
        </View>

        <View className={styles.chapterInfo}>
          <Text className={styles.chapterName}>{chapter.title}</Text>
          <View className={styles.coinRequired}>
            <View className={styles.coinBadge}>币</View>
            <Text className={styles.coinAmount}>{chapter.coinRequired} 书币</Text>
          </View>
        </View>

        <View className={styles.paymentOptions}>
          <Text className={styles.optionTitle}>选择支付方式</Text>

          <View
            className={classNames(
              styles.optionCard,
              useTaskCoin && canUseTaskCoin && styles.selected,
              !canUseTaskCoin && styles.disabled
            )}
            onClick={() => handleOptionClick(true)}
          >
            <View className={styles.optionRadio} />
            <View className={styles.optionContent}>
              <Text className={styles.optionName}>任务书币</Text>
              <Text className={styles.optionBalance}>
                当前余额：
                <Text className={styles.optionCoin}>{taskCoin} 书币</Text>
              </Text>
            </View>
          </View>

          <View
            className={classNames(
              styles.optionCard,
              !useTaskCoin && canUseBalance && styles.selected,
              !canUseBalance && styles.disabled
            )}
            onClick={() => handleOptionClick(false)}
          >
            <View className={styles.optionRadio} />
            <View className={styles.optionContent}>
              <Text className={styles.optionName}>余额书币</Text>
              <Text className={styles.optionBalance}>
                当前余额：
                <Text className={styles.optionCoin}>{balance} 书币</Text>
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.buttonGroup}>
          <Button className={styles.cancelBtn} onClick={onCancel}>
            取消
          </Button>
          <Button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {canConfirm ? '确认解锁' : '书币不足'}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default UnlockModal;
