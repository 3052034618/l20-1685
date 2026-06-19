import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import UnlockModal from '@/components/UnlockModal';
import CoinToast from '@/components/CoinToast';
import { Chapter, Book } from '@/types';
import styles from './index.module.scss';

const ReaderPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastAmount, setToastAmount] = useState(0);
  const scrollRef = useRef<any>(null);
  const { taskCoin, balance, unlockedChapters } = state.user;
  const { books, currentChapter: stateChapter } = state;

  const findBookByChapterId = (chapterId: string): Book | undefined => {
    return books.find((b) => b.latestChapter.id === chapterId);
  };

  const currentChapter: Chapter | null = useMemo(() => {
    if (stateChapter) {
      const book = findBookByChapterId(stateChapter.id);
      if (book) {
        return {
          ...book.latestChapter,
          isUnlocked: unlockedChapters.includes(book.latestChapter.id),
        };
      }
      return { ...stateChapter, isUnlocked: unlockedChapters.includes(stateChapter.id) };
    }
    if (books.length > 0) {
      const firstBook = books[0];
      return {
        ...firstBook.latestChapter,
        isUnlocked: unlockedChapters.includes(firstBook.latestChapter.id),
      };
    }
    return null;
  }, [stateChapter, books, unlockedChapters]);

  const isUnlocked = currentChapter ? unlockedChapters.includes(currentChapter.id) : false;

  const allParagraphs = useMemo(() => {
    if (!currentChapter) return [];
    return currentChapter.content
      .split('\n\n')
      .filter((p) => p.trim());
  }, [currentChapter]);

  const previewParagraphCount = useMemo(() => {
    if (!currentChapter) return 0;
    return Math.max(
      1,
      Math.floor(allParagraphs.length * (currentChapter.previewRatio / 100))
    );
  }, [currentChapter, allParagraphs]);

  const actualPreviewRatio = useMemo(() => {
    if (allParagraphs.length === 0) return 0;
    return Math.round((previewParagraphCount / allParagraphs.length) * 100);
  }, [allParagraphs, previewParagraphCount]);

  const loadDefaultChapter = useCallback(() => {
    if (!state.currentChapter && books.length > 0) {
      dispatch({ type: 'SET_CURRENT_CHAPTER', payload: books[0].latestChapter });
    }
  }, [state.currentChapter, books, dispatch]);

  useEffect(() => {
    loadDefaultChapter();
  }, [loadDefaultChapter]);

  useDidShow(() => {
    console.log('[ReaderPage] Page did show, chapter:', currentChapter?.title);
    loadDefaultChapter();
  });

  const handleScroll = (e: any) => {
    const scrollTop = e.detail.scrollTop;
    const scrollHeight = e.detail.scrollHeight;
    const clientHeight = e.detail.clientHeight;
    const totalScrollable = scrollHeight - clientHeight;
    if (totalScrollable <= 0) return;

    const progress = Math.round((scrollTop / totalScrollable) * 100);
    setReadingProgress(Math.min(progress, 100));

    if (currentChapter && scrollTop > 0) {
      dispatch({
        type: 'SET_READING_PROGRESS',
        payload: { chapterId: currentChapter.id, scrollTop },
      });
    }

    const previewEndRatio = (previewParagraphCount / allParagraphs.length) * 100;
    if (!isUnlocked && currentChapter && progress >= previewEndRatio - 10) {
      if (!showUnlockModal) {
        console.log(
          '[ReaderPage] Reached lock position, progress:',
          progress,
          'previewEnd:',
          previewEndRatio
        );
        setShowUnlockModal(true);
      }
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
    console.log(
      '[ReaderPage] Unlocking chapter:',
      currentChapter.id,
      'useTaskCoin:',
      useTaskCoin,
      'cost:',
      cost
    );

    dispatch({
      type: 'UNLOCK_CHAPTER',
      payload: { chapterId: currentChapter.id, useTaskCoin, cost },
    });

    setShowUnlockModal(false);

    setToastAmount(cost);
    setToastVisible(true);

    Taro.showToast({
      title: '解锁成功！',
      icon: 'success',
    });
  };

  const switchChapter = (offset: number) => {
    if (!currentChapter) return;
    const currentIndex = books.findIndex(
      (book) => book.latestChapter.id === currentChapter.id
    );
    const nextIndex = (currentIndex + offset + books.length) % books.length;
    const nextChapter = books[nextIndex].latestChapter;
    console.log('[ReaderPage] Switch chapter, offset:', offset, 'to:', nextChapter.title);

    dispatch({ type: 'SET_CURRENT_CHAPTER', payload: nextChapter });
    setReadingProgress(0);

    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        animated: false,
      });
    }
  };

  const handlePrevChapter = () => switchChapter(-1);
  const handleNextChapter = () => switchChapter(1);

  const getBookTitle = () => {
    if (!currentChapter) return '';
    const book = books.find((b) => b.latestChapter.id === currentChapter.id);
    return book?.title || '';
  };

  const cost = currentChapter?.coinRequired || 0;
  const totalCoin = taskCoin + balance;
  const canUseTask = taskCoin >= cost;
  const canUseBalance = balance >= cost;
  const canUseCombo = !canUseTask && !canUseBalance && totalCoin >= cost;
  const canUnlock = canUseTask || canUseBalance || canUseCombo;

  const deficit = cost - totalCoin;

  console.log('[ReaderPage] Rendering, canUnlock:', canUnlock, 'cost:', cost, 'taskCoin:', taskCoin, 'balance:', balance);

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

  const previewParagraphs = allParagraphs.slice(0, previewParagraphCount);
  const remainingParagraphs = isUnlocked ? allParagraphs.slice(previewParagraphCount) : [];

  const renderParagraphs = (paragraphs: string[], startIndex: number = 0) =>
    paragraphs.map((paragraph, idx) => (
      <Text key={`p-${startIndex + idx}`} className={styles.paragraph}>
        {paragraph.trim()}
      </Text>
    ));

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
              <Text>{cost} 书币</Text>
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
        scrollTop={0}
      >
        <View className={styles.readingContent}>
          <View className={styles.previewSection}>
            <View className={styles.previewIndicator}>
              免费试读 {actualPreviewRatio}%
            </View>
            {renderParagraphs(previewParagraphs, 0)}
          </View>

          {!isUnlocked && (
            <View className={styles.lockSection}>
              <Text className={styles.lockIcon}>🔒</Text>
              <Text className={styles.lockTitle}>本章为付费内容</Text>
              <Text className={styles.lockDesc}>
                解锁后可阅读全文，支持任务书币与余额合并支付
              </Text>
              <View className={styles.coinRequired}>
                <View className={styles.coinBadgeLarge}>币</View>
                <Text className={styles.coinAmount}>{cost} 书币</Text>
              </View>
              <Button
                className={styles.unlockButton}
                onClick={handleUnlockClick}
                disabled={!canUnlock}
              >
                {canUnlock ? '立即解锁' : `还差 ${deficit} 书币`}
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
              {renderParagraphs(remainingParagraphs, previewParagraphCount)}
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
