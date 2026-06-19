import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import BookCard from '@/components/BookCard';
import { Book } from '@/types';
import styles from './index.module.scss';

const FollowPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const { taskCoin, balance, totalCoin } = state.user;

  const followedBooks = state.books.filter((book) => book.isFollowed);
  const books = followedBooks.map((book) => ({
    ...book,
    latestChapter: {
      ...book.latestChapter,
      isUnlocked: state.user.unlockedChapters.includes(book.latestChapter.id),
    },
  }));

  const getCurrentDate = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[now.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  };

  usePullDownRefresh(() => {
    console.log('[FollowPage] Pull down refresh');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 500);
  });

  const handleBookClick = (book: Book) => {
    console.log('[FollowPage] Book clicked:', book.title);
    dispatch({ type: 'SET_CURRENT_CHAPTER', payload: book.latestChapter });
    Taro.switchTab({ url: '/pages/reader/index' });
  };

  console.log('[FollowPage] Rendering, books count:', books.length);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.welcomeRow}>
          <Text className={styles.welcomeText}>今日追更</Text>
          <Text className={styles.dateText}>{getCurrentDate()}</Text>
        </View>

        <View className={styles.coinBalance}>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>任务书币</Text>
            <View className={styles.balanceValue}>
              <View className={styles.coinIcon}>币</View>
              <Text className={styles.coinNumber}>{taskCoin}</Text>
            </View>
          </View>
          <View className={styles.divider} />
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>余额书币</Text>
            <View className={styles.balanceValue}>
              <View className={styles.coinIcon}>币</View>
              <Text className={styles.coinNumber}>{balance}</Text>
            </View>
          </View>
          <View className={styles.divider} />
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>总计</Text>
            <View className={styles.balanceValue}>
              <View className={styles.coinIcon}>币</View>
              <Text className={styles.coinNumber}>{totalCoin}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>关注作品更新</Text>
          <Text className={styles.updateCount}>{books.length} 本更新</Text>
        </View>

        {books.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📚</Text>
            <Text className={styles.emptyText}>还没有关注的作品</Text>
          </View>
        ) : (
          books.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default FollowPage;
