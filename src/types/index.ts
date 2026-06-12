export interface Variable {
  name: string;
  defaultValue: string;
}

export interface SampleInput {
  id: string;
  name: string;
  values: Record<string, string>;
}

export interface RunResult {
  id: string;
  sampleInputId: string;
  sampleName: string;
  output: string;
  rating: number;
  createdAt: string;
  versionId: string;
  versionNumber: number;
}

export interface PromptVersion {
  id: string;
  experimentId: string;
  content: string;
  variables: Variable[];
  createdAt: string;
  avgRating: number;
  runCount: number;
  note: string;
  versionNumber: number;
  baseVersionNumber?: number;
  isTeamTemplate?: boolean;
  recommendedReason?: string;
  useCases?: string[];
}

export interface RecommendedVersion {
  versionId: string;
  versionNumber: number;
  overallRating: number;
  sampleRatings: Record<string, number>;
  winningSamples: string[];
  reason: string;
  useCases: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  targetType: 'experiment' | 'version' | 'result' | 'sample';
  targetId: string;
  versionNumber?: number;
  sampleName?: string;
  resultId?: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  promptContent: string;
  variables: Variable[];
  sampleInputs: SampleInput[];
  results: RunResult[];
  versions: PromptVersion[];
  comments: Comment[];
  status: 'draft' | 'testing' | 'stable';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  baseVersionNumber?: number;
}

export interface Fragment {
  id: string;
  title: string;
  content: string;
  category: string;
  isTeamTemplate: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
}

export interface SensitiveWord {
  word: string;
  level: 'high' | 'medium' | 'low';
}
