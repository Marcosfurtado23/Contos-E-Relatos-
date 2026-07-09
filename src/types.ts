export type Genre = 'terror' | 'romance' | 'ficcao' | 'fantasia' | 'drama' | 'crime';

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string; // ISO string
}

export interface Story {
  id?: string;
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
  content: string;
  createdAt: any; // Firestore Timestamp or Date ISO
  likes: number;
  reads: number;
  comments: Comment[];
  accentColor?: string;
  isFeatured?: boolean;
}

export interface WritingPrompt {
  genre: Genre;
  title: string;
  prompt: string;
}
