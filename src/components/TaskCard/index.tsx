import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import { Task } from '@/types';
import { useApp } from '@/store/AppContext';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
  onComplete: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const { state } = useApp();
  const { hasCheckedInToday } = state.user;

  const getIconEmoji = () => {
    switch (task.type) {
      case 'checkin':
        return '📅';
      case 'comment':
        return '💬';
      case 'share':
        return '📤';
      case 'read':
        return '📖';
      default:
        return '📋';
    }
  };

  const getIconClass = () => {
    switch (task.type) {
      case 'checkin':
        return styles.iconCheckin;
      case 'comment':
        return styles.iconComment;
      case 'share':
        return styles.iconShare;
      case 'read':
        return styles.iconRead;
      default:
        return styles.iconCheckin;
    }
  };

  const getButtonText = () => {
    if (task.isCompleted) return '已完成';
    if (task.type === 'checkin' && hasCheckedInToday) return '今日已签到';
    if (task.progress < task.target) return '去完成';
    return '领取';
  };

  const getButtonClass = () => {
    if (task.isCompleted) return styles.btnCompleted;
    if (task.type === 'checkin' && hasCheckedInToday) return styles.btnDisabled;
    return styles.btnPrimary;
  };

  const isButtonDisabled = () => {
    if (task.isCompleted) return true;
    if (task.type === 'checkin' && hasCheckedInToday) return true;
    if (task.progress < task.target) return false;
    return false;
  };

  const handleClick = () => {
    if (isButtonDisabled()) return;

    if (task.type === 'checkin') {
      onComplete(task);
    } else if (task.progress >= task.target) {
      onComplete(task);
    } else {
      if (task.type === 'share') {
        Taro.showToast({ title: '分享功能演示', icon: 'none' });
        setTimeout(() => {
          onComplete(task);
        }, 1000);
      } else if (task.type === 'comment') {
        Taro.showToast({ title: '评论功能演示', icon: 'none' });
        setTimeout(() => {
          onComplete(task);
        }, 1000);
      } else {
        Taro.switchTab({ url: '/pages/reader/index' });
      }
    }
  };

  const progressPercent = Math.round((task.progress / task.target) * 100);

  return (
    <View className={styles.taskCard}>
      <View className={styles.taskContent}>
        <View className={classNames(styles.taskIcon, getIconClass())}>
          <Text>{getIconEmoji()}</Text>
        </View>

        <View className={styles.taskInfo}>
          <View className={styles.taskHeader}>
            <Text className={styles.taskTitle}>{task.title}</Text>
            <View className={styles.taskReward}>
              <View className={styles.coinBadge}>币</View>
              <Text className={styles.rewardText}>+{task.coinReward}</Text>
            </View>
          </View>

          <Text className={styles.taskDesc}>{task.description}</Text>

          <View className={styles.progressSection}>
            <View className={styles.progressInfo}>
              <View className={styles.progressBar}>
                <View
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
              <Text className={styles.progressText}>
                {task.progress}/{task.target}
              </Text>
            </View>

            <Button
              className={classNames(styles.actionButton, getButtonClass())}
              onClick={handleClick}
              disabled={isButtonDisabled()}
            >
              {getButtonText()}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TaskCard;
