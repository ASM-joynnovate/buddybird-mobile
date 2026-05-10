export type TrainingAudioSourceType = 'preset' | 'recording';
export type TrainingPitchProfileId = 'parrot-mvp-high';

export interface AudioPitchTransform {
  profileId: TrainingPitchProfileId;
  playbackRate: number;
  preservesPitch: boolean;
  transformedUri?: string;
  appliedAt: string;
}

export interface AudioRecording {
  id: string;
  originalUri: string;
  transformedUri?: string;
  durationSeconds?: number;
  pitchTransform?: AudioPitchTransform;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingWord {
  id: string;
  label: string;
  locale: string;
  sourceType: TrainingAudioSourceType;
  presetKey?: string;
  audioUri: string;
  transformedAudioUri?: string;
  recordingId?: string;
  pitchTransform?: AudioPitchTransform;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSessionSettings {
  wordId: string;
  sourceType: TrainingAudioSourceType;
  totalDurationSeconds: number;
  learningDurationSeconds: number;
  restDurationSeconds: number;
}

export interface TrainingSession {
  id: string;
  wordId: string;
  sourceType: TrainingAudioSourceType;
  totalDurationSeconds: number;
  learningDurationSeconds: number;
  restDurationSeconds: number;
  completedCycles: number;
  totalLearningSeconds: number;
  startedAt: string;
  endedAt?: string;
}

export interface TrainingWordProgress {
  wordId: string;
  totalTrainingSeconds: number;
  sessionCount: number;
  successMarkedAt?: string;
  updatedAt: string;
}

export interface TrainingStore {
  version: 1;
  wordsById: Record<string, TrainingWord>;
  recordingsById: Record<string, AudioRecording>;
  sessionsById: Record<string, TrainingSession>;
  wordProgressByWordId: Record<string, TrainingWordProgress>;
  lastSessionSettings?: TrainingSessionSettings;
  updatedAt: string;
}

export interface CreateAudioRecordingInput {
  originalUri: string;
  transformedUri?: string;
  durationSeconds?: number;
  pitchTransform?: AudioPitchTransform;
}

export interface CreateTrainingWordInput {
  label: string;
  locale: string;
  sourceType: TrainingAudioSourceType;
  presetKey?: string;
  audioUri: string;
  transformedAudioUri?: string;
  recordingId?: string;
  pitchTransform?: AudioPitchTransform;
}

export interface CreateTrainingSessionInput extends TrainingSessionSettings {
  completedCycles: number;
  totalLearningSeconds: number;
  startedAt?: string;
  endedAt?: string;
}

export interface TrainingWordSummary {
  word: TrainingWord;
  progress: TrainingWordProgress;
}
