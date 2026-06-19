import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { mockBooks } from '@/data/books';
import BookCard from '@/components/BookCard';
import { Book } from '@/types';
import styles from './index.module.scss';

const FollowPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { taskCoin, balance, totalCoin } = state.user;

  const getCurrentDate = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[now.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  };

  const loadBooks = () => {
    console.log('[FollowPage] Loading books...');
    setLoading(true);
    setTimeout(() => {
      const followedBooks = mockBooks.filter((book) => book.isFollowed);
      const booksWithUnlockStatus = followedBooks.map((book) => ({
        ...book,
        latestChapter: {
          ...book.latestChapter,
          isUnlocked: state.user.unlockedChapters.includes(book.latestChapter.id),
        },
      }));
      setBooks(booksWithUnlockStatus);
      setLoading(false);
      console.log('[FollowPage] Books loaded:', booksWithUnlockStatus.length);
    }, 500);
  };

  useEffect(() => {
    loadBooks();
  }, [state.user.unlockedChapters]);

  useDidShow(() => {
    console.log('[FollowPage] Page did show');
    loadBooks();
  });

  usePullDownRefresh(() => {
    console.log('[FollowPage] Pull down refresh');
    loadBooks();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleBookClick = (book: Book) => {
    console.log('[FollowPage] Book clicked:', book.title);
    dispatch({ type: 'SET_CURRENT_CHAPTER', payload: book.latestChapter });
    Taro.switchTab({ url: '/pages/reader/index' });
  };

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

        {loading ? (
          <View className={styles.loadingState}>加载中...</View>
        ) : books.length === 0 ? (
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
