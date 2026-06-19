import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { mockBooks } from '@/data/books';
import UnlockModal from '@/components/UnlockModal';
import CoinToast from '@/components/CoinToast';
import { Chapter } from '@/types';
import styles from './index.module.scss';

const ReaderPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastAmount, setToastAmount] = useState(0);
  const scrollRef = useRef<any>(null);
  const { taskCoin, balance, unlockedChapters } = state.user;

  const loadDefaultChapter = useCallback(() => {
    if (state.currentChapter) {
      console.log('[ReaderPage] Loading chapter from state:', state.currentChapter.title);
      setCurrentChapter(state.currentChapter);
      setIsUnlocked(unlockedChapters.includes(state.currentChapter.id));
    } else {
      const defaultBook = mockBooks[0];
      if (defaultBook) {
        console.log('[ReaderPage] Loading default chapter:', defaultBook.latestChapter.title);
        setCurrentChapter(defaultBook.latestChapter);
        setIsUnlocked(unlockedChapters.includes(defaultBook.latestChapter.id));
      }
    }
  }, [state.currentChapter, unlockedChapters]);

  useEffect(() => {
    loadDefaultChapter();
  }, [loadDefaultChapter]);

  useEffect(() => {
    if (currentChapter) {
      setIsUnlocked(unlockedChapters.includes(currentChapter.id));
    }
  }, [currentChapter, unlockedChapters]);

  useDidShow(() => {
    console.log('[ReaderPage] Page did show');
    loadDefaultChapter();
  });

  const handleScroll = (e: any) => {
    const scrollTop = e.detail.scrollTop;
    const scrollHeight = e.detail.scrollHeight;
    const clientHeight = e.detail.clientHeight;
    const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setReadingProgress(Math.min(progress, 100));

    if (currentChapter && scrollTop > 0) {
      dispatch({
        type: 'SET_READING_PROGRESS',
        payload: { chapterId: currentChapter.id, scrollTop },
      });
    }

    if (!isUnlocked && currentChapter && progress >= currentChapter.previewRatio - 5) {
      console.log('[ReaderPage] Reached lock position, showing unlock modal');
      setShowUnlockModal(true);
    }
  };

  const handleUnlockClick = () => {
    console.log('[ReaderPage] Unlock button clicked');
    setShowUnlockModal(true);
  };

  const handleGoToTasks = () => {
    console.log('[ReaderPage] Navigating to tasks page');
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  const handleGoToFollow = () => {
    console.log('[ReaderPage] Navigating to follow page');
    Taro.switchTab({ url: '/pages/follow/index' });
  };

  const handleUnlockConfirm = (useTaskCoin: boolean) => {
    if (!currentChapter) return;

    const cost = currentChapter.coinRequired;
    console.log('[ReaderPage] Unlocking chapter:', currentChapter.id, 'useTaskCoin:', useTaskCoin, 'cost:', cost);

    dispatch({
      type: 'UNLOCK_CHAPTER',
      payload: { chapterId: currentChapter.id, useTaskCoin, cost },
    });

    setShowUnlockModal(false);
    setIsUnlocked(true);

    setToastAmount(cost);
    setToastVisible(true);

    Taro.showToast({
      title: '解锁成功！',
      icon: 'success',
    });

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: 500,
          animated: true,
        });
      }
    }, 500);
  };

  const handlePrevChapter = () => {
    if (!currentChapter) return;
    const currentIndex = mockBooks.findIndex(
      (book) => book.latestChapter.id === currentChapter.id
    );
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : mockBooks.length - 1;
    const prevChapter = mockBooks[prevIndex].latestChapter;
    console.log('[ReaderPage] Previous chapter:', prevChapter.title);
    setCurrentChapter(prevChapter);
    setIsUnlocked(unlockedChapters.includes(prevChapter.id));
    dispatch({ type: 'SET_CURRENT_CHAPTER', payload: prevChapter });
    setReadingProgress(0);
  };

  const handleNextChapter = () => {
    if (!currentChapter) return;
    const currentIndex = mockBooks.findIndex(
      (book) => book.latestChapter.id === currentChapter.id
    );
    const nextIndex = currentIndex < mockBooks.length - 1 ? currentIndex + 1 : 0;
    const nextChapter = mockBooks[nextIndex].latestChapter;
    console.log('[ReaderPage] Next chapter:', nextChapter.title);
    setCurrentChapter(nextChapter);
    setIsUnlocked(unlockedChapters.includes(nextChapter.id));
    dispatch({ type: 'SET_CURRENT_CHAPTER', payload: nextChapter });
    setReadingProgress(0);
  };

  const formatParagraphs = (content: string) => {
    return content
      .split('\n\n')
      .filter((p) => p.trim())
      .map((paragraph, index) => (
        <Text key={index} className={styles.paragraph}>
          {paragraph.trim()}
        </Text>
      ));
  };

  const getBookTitle = () => {
    if (!currentChapter) return '';
    const book = mockBooks.find((b) => b.latestChapter.id === currentChapter.id);
    return book?.title || '';
  };

  const totalCoin = taskCoin + balance;
  const canUnlock = currentChapter ? totalCoin >= currentChapter.coinRequired : false;

  if (!currentChapter) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📖</Text>
          <Text className={styles.emptyTitle}>选择章节开始阅读</Text>
          <Text className={styles.emptyDesc}>前往今日追更，选择你想看的章节</Text>
          <Button className={styles.emptyButton} onClick={handleGoToFollow}>
            去看看
          </Button>
        </View>
      </View>
    );
  }

  const previewContent = formatParagraphs(currentChapter.previewContent);
  const fullContent = formatParagraphs(currentChapter.content);
  const remainingContent = isUnlocked ? fullContent.slice(previewContent.length) : [];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.bookInfo}>
          <Text className={styles.bookTitle}>{getBookTitle()}</Text>
          <View className={styles.chapterNav}>
            <Button className={styles.navBtn} onClick={handlePrevChapter}>
              上一章
            </Button>
            <Button className={styles.navBtn} onClick={handleNextChapter}>
              下一章
            </Button>
          </View>
        </View>
        <Text className={styles.chapterTitle}>{currentChapter.title}</Text>
        <View className={styles.chapterMeta}>
          <Text>{currentChapter.updateTime}</Text>
          {!isUnlocked && (
            <View className={styles.coinBadge}>
              <View className={styles.coinIcon}>币</View>
              <Text>{currentChapter.coinRequired} 书币</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className={styles.content}
        scrollY
        onScroll={handleScroll}
        scrollWithAnimation
      >
        <View className={styles.readingContent}>
          <View className={styles.previewSection}>
            <View className={styles.previewIndicator}>
              免费试读 {currentChapter.previewRatio}%
            </View>
            {previewContent}
          </View>

          {!isUnlocked && (
            <View className={styles.lockSection}>
              <Text className={styles.lockIcon}>🔒</Text>
              <Text className={styles.lockTitle}>本章为付费内容</Text>
              <Text className={styles.lockDesc}>
                解锁后可阅读全文，支持使用任务书币
              </Text>
              <View className={styles.coinRequired}>
                <View className={styles.coinBadgeLarge}>币</View>
                <Text className={styles.coinAmount}>{currentChapter.coinRequired} 书币</Text>
              </View>
              <Button
                className={styles.unlockButton}
                onClick={handleUnlockClick}
                disabled={!canUnlock}
              >
                {canUnlock ? '立即解锁' : '书币不足，去做任务'}
              </Button>
              {!canUnlock && (
                <Button className={styles.goTaskButton} onClick={handleGoToTasks}>
                  前往任务中心赚书币
                </Button>
              )}
            </View>
          )}

          {isUnlocked && (
            <>
              <View className={styles.unlockedSection}>
                <Text className={styles.unlockedIcon}>✅</Text>
                <Text className={styles.unlockedText}>
                  已解锁 · 您已购买本章，可永久阅读
                </Text>
              </View>
              {remainingContent}
            </>
          )}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.balanceInfo}>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>任务书币:</Text>
            <Text className={styles.balanceValue}>{taskCoin}</Text>
          </View>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>余额:</Text>
            <Text className={styles.balanceValue}>{balance}</Text>
          </View>
        </View>
        <View className={styles.progressInfo}>
          已读 <Text className={styles.readingProgress}>{readingProgress}%</Text>
        </View>
      </View>

      <UnlockModal
        visible={showUnlockModal}
        chapter={currentChapter}
        onCancel={() => setShowUnlockModal(false)}
        onConfirm={handleUnlockConfirm}
      />

      <CoinToast
        visible={toastVisible}
        amount={toastAmount}
        message="解锁成功，继续阅读"
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
};

export default ReaderPage;
