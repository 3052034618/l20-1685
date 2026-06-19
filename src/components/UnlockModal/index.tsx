import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import classNames from 'classnames';
import Taro from '@tarojs/taro';
import { Chapter } from '@/types';
import { useApp } from '@/store/AppContext';
import styles from './index.module.scss';

type PaymentMode = 'task' | 'balance' | 'combo';

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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('task');

  useEffect(() => {
    if (visible && chapter) {
      const cost = chapter.coinRequired;
      const totalCoin = taskCoin + balance;
      const canUseTask = taskCoin >= cost;
      const canUseBalance = balance >= cost;
      const canUseCombo = !canUseTask && !canUseBalance && totalCoin >= cost;

      if (canUseTask) {
        setPaymentMode('task');
      } else if (canUseBalance) {
        setPaymentMode('balance');
      } else if (canUseCombo) {
        setPaymentMode('combo');
      }
      console.log(
        '[UnlockModal] Init payment:',
        { canUseTask, canUseBalance, canUseCombo, taskCoin, balance, cost }
      );
    }
  }, [visible, chapter, taskCoin, balance]);

  if (!visible || !chapter) return null;

  const cost = chapter.coinRequired;
  const totalCoin = taskCoin + balance;

  const canUseTask = taskCoin >= cost;
  const canUseBalance = balance >= cost;
  const canUseCombo = !canUseTask && !canUseBalance && totalCoin >= cost;
  const canConfirm = canUseTask || canUseBalance || canUseCombo;

  const getDeduction = (mode: PaymentMode) => {
    if (mode === 'task') {
      return { taskCost: cost, balanceCost: 0 };
    }
    if (mode === 'balance') {
      return { taskCost: 0, balanceCost: cost };
    }
    const taskCost = Math.min(taskCoin, cost);
    const balanceCost = cost - taskCost;
    return { taskCost, balanceCost };
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    const { taskCost, balanceCost } = getDeduction(paymentMode);
    console.log(
      '[UnlockModal] Confirm unlock:',
      { paymentMode, taskCost, balanceCost, total: cost }
    );
    onConfirm(paymentMode !== 'balance');
  };

  const handleOptionClick = (mode: PaymentMode) => {
    if (mode === 'task' && !canUseTask) return;
    if (mode === 'balance' && !canUseBalance) return;
    if (mode === 'combo' && !canUseCombo) return;
    setPaymentMode(mode);
  };

  const handleGoToTasks = () => {
    onCancel();
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  const currentDeduction = getDeduction(paymentMode);

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
            <Text className={styles.coinAmount}>{cost} 书币</Text>
          </View>
        </View>

        {!canConfirm && (
          <View className={styles.insufficientTip}>
            <Text className={styles.insufficientText}>
              当前书币不足，还差
              <Text className={styles.insufficientCoin}> {cost - totalCoin} </Text>
              书币
              {'\n'}去完成任务轻松赚取吧～
            </Text>
          </View>
        )}

        <View className={styles.paymentOptions}>
          <Text className={styles.optionTitle}>选择支付方式</Text>

          <View
            className={classNames(
              styles.optionCard,
              paymentMode === 'task' && canUseTask && styles.selected,
              !canUseTask && styles.disabled
            )}
            onClick={() => handleOptionClick('task')}
          >
            <View className={styles.optionRadio} />
            <View className={styles.optionContent}>
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Text className={styles.optionName}>任务书币支付</Text>
                {canUseTask && <Text className={styles.recommendTag}>推荐</Text>}
              </View>
              <Text className={styles.optionBalance}>
                可用：
                <Text className={styles.optionCoin}>{taskCoin} 书币</Text>
              </Text>
            </View>
          </View>

          <View
            className={classNames(
              styles.optionCard,
              paymentMode === 'balance' && canUseBalance && styles.selected,
              !canUseBalance && styles.disabled
            )}
            onClick={() => handleOptionClick('balance')}
          >
            <View className={styles.optionRadio} />
            <View className={styles.optionContent}>
              <Text className={styles.optionName}>余额书币支付</Text>
              <Text className={styles.optionBalance}>
                可用：
                <Text className={styles.optionCoin}>{balance} 书币</Text>
              </Text>
            </View>
          </View>

          {canUseCombo && (
            <View
              className={classNames(
                styles.optionCard,
                paymentMode === 'combo' && styles.selected
              )}
              onClick={() => handleOptionClick('combo')}
            >
              <View className={styles.optionRadio} />
              <View className={styles.optionContent}>
                <View style={{ display: 'flex', alignItems: 'center' }}>
                  <Text className={styles.optionName}>合并支付</Text>
                  <Text className={styles.recommendTag}>推荐</Text>
                </View>
                <View className={styles.deductionRow}>
                  <Text>任务书币扣除</Text>
                  <Text className={styles.deductionAmount}>-{currentDeduction.taskCost}</Text>
                </View>
                <View className={styles.deductionRow}>
                  <Text>余额书币扣除</Text>
                  <Text className={styles.deductionAmount}>-{currentDeduction.balanceCost}</Text>
                </View>
                <View className={classNames(styles.deductionRow, styles.totalRow)}>
                  <Text>合计</Text>
                  <Text className={styles.deductionAmount}>-{cost} 书币</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View className={styles.buttonGroup}>
          <Button className={styles.cancelBtn} onClick={canConfirm ? onCancel : handleGoToTasks}>
            {canConfirm ? '取消' : '去赚书币'}
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
