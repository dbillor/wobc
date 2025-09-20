export type ToneOption =
  | "gentle"
  | "playful"
  | "adventurous"
  | "soothing"
  | "wondrous"
  | "custom";

export interface CharacterInput {
  id: string;
  name: string;
  description: string;
  referenceImageDataUrl?: string;
}

export interface StoryIntent {
  theme: string;
  lesson: string;
  ageRange: string;
  tone: ToneOption;
  customTone?: string;
  pageCount: number;
  styleKeywords: string[];
  characters: CharacterInput[];
}

export interface StoryPage {
  pageNumber: number;
  headline: string;
  narrative: string;
  illustrationPrompt: string;
  keyMoments: string[];
  imageUrl?: string;
}

export type GenerationStatus =
  | "pending-story"
  | "pending-images"
  | "completed"
  | "errored";

export interface GeneratedBook {
  id: string;
  createdAt: string;
  intent: StoryIntent;
  title: string;
  subtitle: string;
  dedication: string;
  moral: string;
  aestheticNotes: string;
  status: GenerationStatus;
  pages: StoryPage[];
}

export interface StoryJobProgress {
  jobId: string;
  status: GenerationStatus;
  message: string;
  completedPages: number;
  totalPages: number;
  bookId?: string;
  errors?: string[];
}

export interface StoryGenerationResult {
  book: GeneratedBook;
  progress: StoryJobProgress;
}

