import { create } from 'zustand';
import type { Experiment, Fragment, PromptVersion, RunResult, SampleInput } from '@/types';
import { mockExperiments, mockFragments } from '@/data/experiments';

interface PromptStore {
  experiments: Experiment[];
  fragments: Fragment[];
  currentExperimentId: string | null;
  currentVersionId: string | null;

  setCurrentExperiment: (id: string) => void;
  setCurrentVersion: (id: string) => void;
  addExperiment: (exp: Experiment) => void;
  updateExperiment: (id: string, updates: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  addFragment: (frag: Fragment) => void;
  deleteFragment: (id: string) => void;
  incrementFragmentUsage: (id: string) => void;
  addVersion: (version: PromptVersion) => void;
  addSampleInput: (experimentId: string, input: SampleInput) => void;
  addRunResult: (experimentId: string, result: RunResult) => void;
  updateRunResultRating: (experimentId: string, resultId: string, rating: number) => void;
  addComment: (experimentId: string, comment: Experiment['comments'][0]) => void;
}

export const usePromptStore = create<PromptStore>((set) => ({
  experiments: mockExperiments,
  fragments: mockFragments,
  currentExperimentId: mockExperiments[0]?.id || null,
  currentVersionId: null,

  setCurrentExperiment: (id) => set({ currentExperimentId: id }),
  setCurrentVersion: (id) => set({ currentVersionId: id }),

  addExperiment: (exp) =>
    set((state) => ({ experiments: [exp, ...state.experiments] })),

  updateExperiment: (id, updates) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    })),

  deleteExperiment: (id) =>
    set((state) => ({
      experiments: state.experiments.filter((e) => e.id !== id),
    })),

  addFragment: (frag) =>
    set((state) => ({ fragments: [frag, ...state.fragments] })),

  deleteFragment: (id) =>
    set((state) => ({
      fragments: state.fragments.filter((f) => f.id !== id),
    })),

  incrementFragmentUsage: (id) =>
    set((state) => ({
      fragments: state.fragments.map((f) =>
        f.id === id ? { ...f, usageCount: f.usageCount + 1 } : f
      ),
    })),

  addVersion: (version) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === version.experimentId
          ? { ...e, versions: [version, ...e.versions] }
          : e
      ),
    })),

  addSampleInput: (experimentId, input) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === experimentId
          ? { ...e, sampleInputs: [...e.sampleInputs, input] }
          : e
      ),
    })),

  addRunResult: (experimentId, result) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === experimentId
          ? { ...e, results: [...e.results, result] }
          : e
      ),
    })),

  updateRunResultRating: (experimentId, resultId, rating) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === experimentId
          ? {
              ...e,
              results: e.results.map((r) =>
                r.id === resultId ? { ...r, rating } : r
              ),
            }
          : e
      ),
    })),

  addComment: (experimentId, comment) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === experimentId
          ? { ...e, comments: [comment, ...e.comments] }
          : e
      ),
    })),
}));
