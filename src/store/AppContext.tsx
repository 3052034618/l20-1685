import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction, UserState } from '@/types';

const initialUserState: UserState = {
  balance: 8,
  taskCoin: 0,
  totalCoin: 8,
  continuousCheckinDays: 3,
  hasCheckedInToday: false,
  unlockedChapters: [],
  readingProgress: null,
};

const initialState: AppState = {
  user: initialUserState,
  books: [],
  tasks: [],
  currentChapter: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  console.log('[AppContext] Action dispatched:', action.type, action.payload || '');

  switch (action.type) {
    case 'CHECK_IN': {
      const checkinCoin = 5 + Math.min(state.user.continuousCheckinDays, 5);
      const newTaskCoin = state.user.taskCoin + checkinCoin;
      console.log('[AppContext] Check-in reward:', checkinCoin, 'coins');
      return {
        ...state,
        user: {
          ...state.user,
          taskCoin: newTaskCoin,
          totalCoin: state.user.balance + newTaskCoin,
          hasCheckedInToday: true,
          continuousCheckinDays: state.user.continuousCheckinDays + 1,
        },
      };
    }

    case 'COMPLETE_TASK': {
      const { taskId, coinReward } = action.payload;
      const newTaskCoin = state.user.taskCoin + coinReward;
      console.log('[AppContext] Task completed:', taskId, 'reward:', coinReward);
      return {
        ...state,
        user: {
          ...state.user,
          taskCoin: newTaskCoin,
          totalCoin: state.user.balance + newTaskCoin,
        },
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, isCompleted: true, progress: task.target } : task
        ),
      };
    }

    case 'UNLOCK_CHAPTER': {
      const { chapterId, useTaskCoin, cost } = action.payload;
      let newBalance = state.user.balance;
      let newTaskCoin = state.user.taskCoin;

      if (useTaskCoin) {
        newTaskCoin = state.user.taskCoin - cost;
      } else {
        newBalance = state.user.balance - cost;
      }

      console.log('[AppContext] Chapter unlocked:', chapterId, 'cost:', cost, 'useTaskCoin:', useTaskCoin);

      return {
        ...state,
        user: {
          ...state.user,
          balance: newBalance,
          taskCoin: newTaskCoin,
          totalCoin: newBalance + newTaskCoin,
          unlockedChapters: [...state.user.unlockedChapters, chapterId],
        },
      };
    }

    case 'SET_READING_PROGRESS': {
      const { chapterId, scrollTop } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          readingProgress: { chapterId, scrollTop },
        },
      };
    }

    case 'SET_CURRENT_CHAPTER': {
      return {
        ...state,
        currentChapter: action.payload,
      };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
