export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  latestChapter: Chapter;
  isFollowed: boolean;
  updateTime: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  chapterNo: number;
  content: string;
  previewContent: string;
  previewRatio: number;
  coinRequired: number;
  isUnlocked: boolean;
  updateTime: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  coinReward: number;
  type: 'checkin' | 'comment' | 'share' | 'read';
  isCompleted: boolean;
  progress: number;
  target: number;
}

export interface UserState {
  balance: number;
  taskCoin: number;
  totalCoin: number;
  continuousCheckinDays: number;
  hasCheckedInToday: boolean;
  unlockedChapters: string[];
  readingProgress: {
    chapterId: string;
    scrollTop: number;
  } | null;
}

export interface AppState {
  user: UserState;
  books: Book[];
  tasks: Task[];
  currentChapter: Chapter | null;
}

export type AppAction =
  | { type: 'CHECK_IN' }
  | { type: 'COMPLETE_TASK'; payload: { taskId: string; coinReward: number } }
  | { type: 'UNLOCK_CHAPTER'; payload: { chapterId: string; useTaskCoin: boolean; cost: number } }
  | { type: 'SET_READING_PROGRESS'; payload: { chapterId: string; scrollTop: number } }
  | { type: 'SET_CURRENT_CHAPTER'; payload: Chapter };
