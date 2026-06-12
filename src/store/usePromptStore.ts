import { create } from 'zustand';
import type { Experiment, Fragment, PromptVersion, RunResult, SampleInput, Variable } from '@/types';
import { mockExperiments, mockFragments } from '@/data/experiments';
import { generateId, extractVariables } from '@/utils/helpers';

interface PromptStore {
  experiments: Experiment[];
  fragments: Fragment[];
  currentExperimentId: string | null;
  currentVersionId: string | null;
  pendingFragment: string | null;

  setCurrentExperiment: (id: string) => void;
  setCurrentVersion: (id: string) => void;
  setPendingFragment: (content: string | null) => void;
  addExperiment: (exp: Experiment) => void;
  updateExperiment: (id: string, updates: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  updateExperimentPrompt: (id: string, content: string, variables: Variable[]) => void;
  rollbackToVersion: (experimentId: string, versionId: string) => void;
  addFragment: (frag: Fragment) => void;
  deleteFragment: (id: string) => void;
  incrementFragmentUsage: (id: string) => void;
  addVersion: (version: PromptVersion) => void;
  addSampleInput: (experimentId: string, input: SampleInput) => void;
  addRunResult: (experimentId: string, result: RunResult) => void;
  clearResults: (experimentId: string) => void;
  updateRunResultRating: (experimentId: string, resultId: string, rating: number) => void;
  addComment: (experimentId: string, comment: Experiment['comments'][0]) => void;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  experiments: mockExperiments,
  fragments: mockFragments,
  currentExperimentId: mockExperiments[0]?.id || null,
  currentVersionId: null,
  pendingFragment: null,

  setCurrentExperiment: (id) => set({ currentExperimentId: id }),
  setCurrentVersion: (id) => set({ currentVersionId: id }),
  setPendingFragment: (content) => set({ pendingFragment: content }),

  addExperiment: (exp) =>
    set((state) => ({ experiments: [exp, ...state.experiments] })),

  updateExperiment: (id, updates) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    })),

  updateExperimentPrompt: (id, content, variables) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === id ? { ...e, promptContent: content, variables, updatedAt: new Date().toISOString() } : e
      ),
    })),

  rollbackToVersion: (experimentId, versionId) => {
    const state = get();
    const exp = state.experiments.find((e) => e.id === experimentId);
    const version = exp?.versions.find((v) => v.id === versionId);
    if (!exp || !version) return;
    set({
      experiments: state.experiments.map((e) =>
        e.id === experimentId
          ? { ...e, promptContent: version.content, variables: version.variables, updatedAt: new Date().toISOString() }
          : e
      ),
    });
  },

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

  clearResults: (experimentId) =>
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === experimentId
          ? { ...e, results: [] }
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
