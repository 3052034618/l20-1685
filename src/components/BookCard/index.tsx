import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import { Book } from '@/types';
import { useApp } from '@/store/AppContext';
import styles from './index.module.scss';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const { state } = useApp();
  const { taskCoin, balance } = state.user;
  const { latestChapter } = book;
  const totalCoin = taskCoin + balance;

  const cost = latestChapter.coinRequired;
  const canUseTask = taskCoin >= cost;
  const canUseBalance = balance >= cost;
  const canUseCombo = !canUseTask && !canUseBalance && totalCoin >= cost;
  const isEnough = canUseTask || canUseBalance || canUseCombo;
  const deficit = cost - totalCoin;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.switchTab({ url: '/pages/reader/index' });
    }
  };

  const getCoinDisplayText = () => {
    if (isEnough) {
      if (canUseTask) return '任务书币可解锁';
      if (canUseBalance) return '余额书币可解锁';
      if (canUseCombo) return '可合并支付解锁';
      return '书币充足，可解锁';
    }
    return `还差 ${deficit} 书币`;
  };

  return (
    <View className={styles.bookCard} onClick={handleClick}>
      <View className={styles.bookContent}>
        <View className={styles.bookCover}>
          <Image src={book.cover} mode="aspectFill" />
        </View>

        <View className={styles.bookInfo}>
          <View className={styles.bookHeader}>
            <Text className={styles.bookTitle}>{book.title}</Text>
            <Text className={styles.updateTime}>{book.updateTime}</Text>
          </View>

          <Text className={styles.bookAuthor}>{book.author}</Text>

          <Text className={styles.chapterTitle}>{latestChapter.title}</Text>

          <View className={styles.progressSection}>
            <View className={styles.progressLabel}>
              <Text className={styles.progressText}>试读进度</Text>
              <Text className={styles.previewRatio}>{latestChapter.previewRatio}% 免费</Text>
            </View>
            <View className={styles.progressBar}>
              <View
                className={styles.progressFill}
                style={{ width: `${latestChapter.previewRatio}%` }}
              />
            </View>
          </View>

          <View className={styles.coinSection}>
            <View className={styles.coinInfo}>
              <View className={styles.coinIcon}>币</View>
              <Text className={styles.coinRequired}>{latestChapter.coinRequired} 书币</Text>
            </View>

            <View
              className={classNames(
                isEnough ? styles.enoughTip : styles.deficitTip
              )}
            >
              {getCoinDisplayText()}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BookCard;
