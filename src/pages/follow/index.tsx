import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import { useApp } from '@/store/AppContext';
import BookCard from '@/components/BookCard';
import { Book } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | 'unlockable' | 'insufficient' | 'unlocked';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'unlockable', label: '可解锁' },
  { value: 'insufficient', label: '书币不足' },
  { value: 'unlocked', label: '已解锁' },
];

const FollowPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const { taskCoin, balance, totalCoin } = state.user;
  const [filter, setFilter] = useState<FilterType>('all');

  const booksWithStatus = useMemo(() => {
    return state.books.filter((book) => book.isFollowed).map((book) => {
      const isUnlocked = state.user.unlockedChapters.includes(book.latestChapter.id);
      const cost = book.latestChapter.coinRequired;
      const canUseTask = taskCoin >= cost;
      const canUseBalance = balance >= cost;
      const canUseCombo = !canUseTask && !canUseBalance && totalCoin >= cost;
      const isEnough = canUseTask || canUseBalance || canUseCombo;

      return {
        ...book,
        latestChapter: {
          ...book.latestChapter,
          isUnlocked,
        },
        isUnlocked,
        isEnough,
      };
    });
  }, [state.books, state.user.unlockedChapters, taskCoin, balance, totalCoin]);

  const filteredBooks = useMemo(() => {
    switch (filter) {
      case 'unlockable':
        return booksWithStatus.filter((b) => !b.isUnlocked && b.isEnough);
      case 'insufficient':
        return booksWithStatus.filter((b) => !b.isUnlocked && !b.isEnough);
      case 'unlocked':
        return booksWithStatus.filter((b) => b.isUnlocked);
      case 'all':
      default:
        return booksWithStatus;
    }
  }, [booksWithStatus, filter]);

  const filterCounts = useMemo(() => {
    return {
      all: booksWithStatus.length,
      unlockable: booksWithStatus.filter((b) => !b.isUnlocked && b.isEnough).length,
      insufficient: booksWithStatus.filter((b) => !b.isUnlocked && !b.isEnough).length,
      unlocked: booksWithStatus.filter((b) => b.isUnlocked).length,
    };
  }, [booksWithStatus]);

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

  console.log('[FollowPage] Rendering, books count:', booksWithStatus.length);

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

      <View className={styles.filterBar}>
        <ScrollView className={styles.filterScroll} scrollX showScrollbar={false}>
          {filterOptions.map((opt) => (
            <View
              key={opt.value}
              className={classNames(
                styles.filterItem,
                filter === opt.value && styles.filterItemActive
              )}
              onClick={() => setFilter(opt.value)}
            >
              <Text
                className={classNames(
                  styles.filterLabel,
                  filter === opt.value && styles.filterLabelActive
                )}
              >
                {opt.label}
              </Text>
              <Text
                className={classNames(
                  styles.filterCount,
                  filter === opt.value && styles.filterCountActive
                )}
              >
                {filterCounts[opt.value]}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>关注作品更新</Text>
          <Text className={styles.updateCount}>{filteredBooks.length} 本</Text>
        </View>

        {filteredBooks.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📚</Text>
            <Text className={styles.emptyText}>
              {filter === 'all' ? '还没有关注的作品' : '没有符合条件的作品'}
            </Text>
          </View>
        ) : (
          filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default FollowPage;
