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
  completedAt?: number;
}

export interface TransactionRecord {
  id: string;
  type: 'reward' | 'consume';
  amount: number;
  balanceUsed?: number;
  taskCoinUsed?: number;
  description: string;
  relatedId?: string;
  createdAt: number;
}

export interface BookReadingProgress {
  bookId: string;
  chapterId: string;
  scrollTop: number;
  readPercent: number;
  updatedAt: number;
}

export interface UserState {
  balance: number;
  taskCoin: number;
  totalCoin: number;
  continuousCheckinDays: number;
  hasCheckedInToday: boolean;
  lastCheckinDate?: string;
  unlockedChapters: string[];
  readingProgress: Record<string, BookReadingProgress>;
  transactions: TransactionRecord[];
}

export interface AppState {
  user: UserState;
  books: Book[];
  tasks: Task[];
  currentChapter: Chapter | null;
}

export type AppAction =
  | { type: 'CHECK_IN' }
  | { type: 'COMPLETE_TASK'; payload: { taskId: string; coinReward: number; taskTitle: string } }
  | { type: 'UNLOCK_CHAPTER'; payload: { chapterId: string; bookId: string; useTaskCoin: boolean; cost: number; chapterTitle: string } }
  | { type: 'SET_READING_PROGRESS'; payload: { bookId: string; chapterId: string; scrollTop: number; readPercent: number } }
  | { type: 'SET_CURRENT_CHAPTER'; payload: Chapter }
  | { type: 'HYDRATE_STATE'; payload: Partial<UserState> };
