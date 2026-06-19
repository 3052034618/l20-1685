import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import { useApp } from '@/store/AppContext';
import TaskCard from '@/components/TaskCard';
import CoinToast from '@/components/CoinToast';
import { Task } from '@/types';
import styles from './index.module.scss';

const TasksPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastAmount, setToastAmount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const { taskCoin, balance, continuousCheckinDays, hasCheckedInToday } = state.user;
  const tasks = state.tasks;

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  usePullDownRefresh(() => {
    console.log('[TasksPage] Pull down refresh');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 500);
  });

  const handleCheckin = () => {
    if (hasCheckedInToday) return;

    const reward = 5 + Math.min(continuousCheckinDays, 5);
    console.log('[TasksPage] Checking in, reward:', reward);

    dispatch({ type: 'CHECK_IN' });

    setToastAmount(reward);
    setToastMessage(`连续签到${continuousCheckinDays + 1}天，书币已到账`);
    setToastVisible(true);

    Taro.showToast({
      title: `签到成功 +${reward}书币`,
      icon: 'success',
    });
  };

  const handleTaskComplete = (task: Task) => {
    console.log('[TasksPage] Task button clicked:', task.title, 'isCompleted:', task.isCompleted);

    if (task.isCompleted) {
      console.warn('[TasksPage] Task already completed, ignoring');
      return;
    }

    if (task.type === 'checkin') {
      handleCheckin();
      return;
    }

    console.log('[TasksPage] Completing task:', task.title, 'reward:', task.coinReward);

    dispatch({
      type: 'COMPLETE_TASK',
      payload: { taskId: task.id, coinReward: task.coinReward },
    });

    setToastAmount(task.coinReward);
    setToastMessage(`${task.title}完成，书币已到账`);
    setToastVisible(true);

    Taro.showToast({
      title: `+${task.coinReward}书币`,
      icon: 'success',
    });
  };

  const isDayChecked = (index: number) => {
    if (index < continuousCheckinDays % 7) return true;
    if (index === continuousCheckinDays % 7 && hasCheckedInToday) return true;
    return false;
  };

  const isToday = (index: number) => {
    return index === continuousCheckinDays % 7 && !hasCheckedInToday;
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const checkinReward = 5 + Math.min(continuousCheckinDays, 5);

  console.log('[TasksPage] Rendering, completedCount:', completedCount, 'total:', tasks.length);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.checkinSection}>
          <View className={styles.checkinHeader}>
            <Text className={styles.checkinTitle}>每日签到</Text>
            <Text className={styles.checkinDays}>
              已连续签到 {continuousCheckinDays} 天
            </Text>
          </View>

          <View className={styles.checkinCard}>
            <View className={styles.checkinWeek}>
              {weekDays.map((day, index) => (
                <View key={index} className={styles.dayItem}>
                  <View
                    className={classNames(
                      styles.dayCircle,
                      isDayChecked(index) && styles.checked,
                      isToday(index) && styles.today
                    )}
                  >
                    {isDayChecked(index) ? '✓' : day}
                  </View>
                  <Text
                    className={classNames(
                      styles.dayText,
                      isToday(index) && styles.today
                    )}
                  >
                    {isToday(index) ? '今天' : `第${index + 1}天`}
                  </Text>
                </View>
              ))}
            </View>

            <Button
              className={styles.checkinButton}
              onClick={handleCheckin}
              disabled={hasCheckedInToday}
            >
              {hasCheckedInToday
                ? '今日已签到'
                : `立即签到 +${checkinReward}书币`}
            </Button>
          </View>

          <View className={styles.balanceSection}>
            <View className={styles.balanceCard}>
              <Text className={styles.balanceLabel}>任务书币</Text>
              <View className={styles.balanceValue}>
                <View className={styles.coinIcon}>币</View>
                <Text className={styles.coinNumber}>{taskCoin}</Text>
              </View>
            </View>
            <View className={styles.balanceCard}>
              <Text className={styles.balanceLabel}>余额书币</Text>
              <View className={styles.balanceValue}>
                <View className={styles.coinIcon}>币</View>
                <Text className={styles.coinNumber}>{balance}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>任务中心</Text>
          <Text className={styles.taskCount}>
            已完成 <Text className={styles.completedCount}>{completedCount}</Text>/{tasks.length}
          </Text>
        </View>

        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
        ))}
      </ScrollView>

      <CoinToast
        visible={toastVisible}
        amount={toastAmount}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
};

export default TasksPage;
