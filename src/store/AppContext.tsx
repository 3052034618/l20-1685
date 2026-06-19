import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { AppState, AppAction, UserState, TransactionRecord, BookReadingProgress } from '@/types';
import { mockTasks } from '@/data/tasks';
import { mockBooks } from '@/data/books';

const STORAGE_KEY = 'reader_app_state_v1';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const defaultUserState: UserState = {
  balance: 8,
  taskCoin: 5,
  totalCoin: 13,
  continuousCheckinDays: 3,
  hasCheckedInToday: false,
  lastCheckinDate: undefined,
  unlockedChapters: [],
  readingProgress: {},
  transactions: [],
};

function loadPersistedState(): Partial<UserState> | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log('[AppContext] Loaded persisted state from localStorage');
        return parsed;
      }
    }
    const taroRaw = Taro.getStorageSync(STORAGE_KEY);
    if (taroRaw) {
      console.log('[AppContext] Loaded persisted state from Taro storage');
      return typeof taroRaw === 'string' ? JSON.parse(taroRaw) : taroRaw;
    }
  } catch (e) {
    console.warn('[AppContext] Failed to load persisted state:', e);
  }
  return null;
}

function savePersistedState(state: UserState & { completedTasks?: string[] }) {
  try {
    const toSave = {
      balance: state.balance,
      taskCoin: state.taskCoin,
      totalCoin: state.totalCoin,
      continuousCheckinDays: state.continuousCheckinDays,
      hasCheckedInToday: state.hasCheckedInToday,
      lastCheckinDate: state.lastCheckinDate,
      unlockedChapters: state.unlockedChapters,
      readingProgress: state.readingProgress,
      transactions: state.transactions,
      completedTasks: state.completedTasks || [],
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
    Taro.setStorageSync(STORAGE_KEY, toSave);
    console.log('[AppContext] State persisted');
  } catch (e) {
    console.warn('[AppContext] Failed to persist state:', e);
  }
}

function createInitialUserState(): UserState {
  const persisted = loadPersistedState();
  if (!persisted) {
    return { ...defaultUserState };
  }

  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  const lastDate = persisted.lastCheckinDate;

  let hasCheckedInToday = persisted.hasCheckedInToday || false;
  let continuousCheckinDays = persisted.continuousCheckinDays || 0;

  if (lastDate !== today) {
    hasCheckedInToday = false;
    if (lastDate !== yesterday) {
      continuousCheckinDays = 0;
    }
  }

  return {
    balance: persisted.balance ?? defaultUserState.balance,
    taskCoin: persisted.taskCoin ?? defaultUserState.taskCoin,
    totalCoin: (persisted.balance ?? defaultUserState.balance) + (persisted.taskCoin ?? defaultUserState.taskCoin),
    continuousCheckinDays,
    hasCheckedInToday,
    lastCheckinDate: persisted.lastCheckinDate,
    unlockedChapters: persisted.unlockedChapters ?? [],
    readingProgress: persisted.readingProgress ?? {},
    transactions: persisted.transactions ?? [],
  };
}

const initialUserState = createInitialUserState();

const initialState: AppState = {
  user: initialUserState,
  books: mockBooks,
  tasks: mockTasks.map((t) => {
    const completedTasks = (loadPersistedState() as any)?.completedTasks || [];
    const isCompleted = completedTasks.includes(t.id);
    return { ...t, isCompleted };
  }),
  currentChapter: null,
};

function addTransaction(
  transactions: TransactionRecord[],
  record: Omit<TransactionRecord, 'id' | 'createdAt'>
): TransactionRecord[] {
  const newRecord: TransactionRecord = {
    ...record,
    id: generateId(),
    createdAt: Date.now(),
  };
  return [newRecord, ...transactions].slice(0, 20);
}

function appReducer(state: AppState, action: AppAction): AppState {
  console.log('[AppContext] Action dispatched:', action.type, action.payload || '');

  let newState: AppState = state;

  switch (action.type) {
    case 'HYDRATE_STATE': {
      console.log('[AppContext] Hydrating state from storage');
      return state;
    }

    case 'CHECK_IN': {
      if (state.user.hasCheckedInToday) {
        console.warn('[AppContext] Already checked in today, ignoring');
        return state;
      }

      const today = getTodayStr();
      const yesterday = getYesterdayStr();
      const lastDate = state.user.lastCheckinDate;
      let continuousDays = state.user.continuousCheckinDays;

      if (lastDate === yesterday || lastDate === today) {
        continuousDays += 1;
      } else {
        continuousDays = 1;
      }

      const checkinCoin = 5 + Math.min(continuousDays - 1, 5);
      const newTaskCoin = state.user.taskCoin + checkinCoin;

      console.log('[AppContext] Check-in reward:', checkinCoin, 'coins, continuousDays:', continuousDays);

      const newTransactions = addTransaction(state.user.transactions, {
        type: 'reward',
        amount: checkinCoin,
        taskCoinUsed: 0,
        balanceUsed: 0,
        description: `连续签到${continuousDays}天奖励`,
        relatedId: 'checkin',
      });

      const updatedTasks = state.tasks.map((task) =>
        task.type === 'checkin' ? { ...task, isCompleted: true, progress: task.target, completedAt: Date.now() } : task
      );

      newState = {
        ...state,
        user: {
          ...state.user,
          taskCoin: newTaskCoin,
          totalCoin: state.user.balance + newTaskCoin,
          hasCheckedInToday: true,
          continuousCheckinDays: continuousDays,
          lastCheckinDate: today,
          transactions: newTransactions,
        },
        tasks: updatedTasks,
      };
      break;
    }

    case 'COMPLETE_TASK': {
      const { taskId, coinReward, taskTitle } = action.payload;

      const existingTask = state.tasks.find((t) => t.id === taskId);
      if (!existingTask) {
        console.warn('[AppContext] Task not found:', taskId);
        return state;
      }
      if (existingTask.isCompleted) {
        console.warn('[AppContext] Task already completed:', taskId);
        return state;
      }

      const newTaskCoin = state.user.taskCoin + coinReward;

      console.log('[AppContext] Task completed:', taskTitle, 'reward:', coinReward);

      const newTransactions = addTransaction(state.user.transactions, {
        type: 'reward',
        amount: coinReward,
        taskCoinUsed: 0,
        balanceUsed: 0,
        description: `完成任务：${taskTitle}`,
        relatedId: taskId,
      });

      newState = {
        ...state,
        user: {
          ...state.user,
          taskCoin: newTaskCoin,
          totalCoin: state.user.balance + newTaskCoin,
          transactions: newTransactions,
        },
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, isCompleted: true, progress: task.target, completedAt: Date.now() }
            : task
        ),
      };
      break;
    }

    case 'UNLOCK_CHAPTER': {
      const { chapterId, bookId, useTaskCoin, cost, chapterTitle } = action.payload;

      if (state.user.unlockedChapters.includes(chapterId)) {
        console.warn('[AppContext] Chapter already unlocked:', chapterId);
        return state;
      }

      let newBalance = state.user.balance;
      let newTaskCoin = state.user.taskCoin;
      let balanceUsed = 0;
      let taskCoinUsed = 0;

      if (useTaskCoin) {
        if (state.user.taskCoin >= cost) {
          taskCoinUsed = cost;
          newTaskCoin = state.user.taskCoin - cost;
        } else {
          taskCoinUsed = state.user.taskCoin;
          newTaskCoin = 0;
          balanceUsed = cost - state.user.taskCoin;
          newBalance = state.user.balance - balanceUsed;
        }
      } else {
        if (state.user.balance >= cost) {
          balanceUsed = cost;
          newBalance = state.user.balance - cost;
        } else {
          balanceUsed = state.user.balance;
          newBalance = 0;
          taskCoinUsed = cost - state.user.balance;
          newTaskCoin = state.user.taskCoin - taskCoinUsed;
        }
      }

      console.log(
        '[AppContext] Chapter unlocked:',
        chapterTitle,
        'taskCoinUsed:',
        taskCoinUsed,
        'balanceUsed:',
        balanceUsed
      );

      const payMethod = taskCoinUsed > 0 && balanceUsed > 0
        ? '合并支付'
        : taskCoinUsed > 0
        ? '任务书币'
        : '余额书币';

      const newTransactions = addTransaction(state.user.transactions, {
        type: 'consume',
        amount: cost,
        taskCoinUsed,
        balanceUsed,
        description: `解锁章节：${chapterTitle}（${payMethod}）`,
        relatedId: chapterId,
      });

      newState = {
        ...state,
        user: {
          ...state.user,
          balance: newBalance,
          taskCoin: newTaskCoin,
          totalCoin: newBalance + newTaskCoin,
          unlockedChapters: [...state.user.unlockedChapters, chapterId],
          transactions: newTransactions,
        },
      };
      break;
    }

    case 'SET_READING_PROGRESS': {
      const { bookId, chapterId, scrollTop, readPercent } = action.payload;

      const currentProgress = state.user.readingProgress[bookId];
      if (
        currentProgress &&
        currentProgress.scrollTop === scrollTop &&
        currentProgress.readPercent === readPercent
      ) {
        return state;
      }

      const newProgress: Record<string, BookReadingProgress> = {
        ...state.user.readingProgress,
        [bookId]: {
          bookId,
          chapterId,
          scrollTop,
          readPercent,
          updatedAt: Date.now(),
        },
      };

      newState = {
        ...state,
        user: {
          ...state.user,
          readingProgress: newProgress,
        },
      };
      break;
    }

    case 'SET_CURRENT_CHAPTER': {
      newState = {
        ...state,
        currentChapter: action.payload,
      };
      break;
    }

    default:
      return state;
  }

  if (newState !== state) {
    const completedTaskIds = newState.tasks.filter((t) => t.isCompleted).map((t) => t.id);
    savePersistedState({
      ...newState.user,
      // @ts-ignore 向后兼容持久化
      completedTasks: completedTaskIds,
    });
  }

  return newState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    console.log('[AppContext] AppProvider initialized');
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
