import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Experiment, Fragment, PromptVersion, RunResult, SampleInput, Variable } from '@/types';
import { mockExperiments, mockFragments } from '@/data/experiments';
import { generateId, extractVariables } from '@/utils/helpers';

const STORAGE_KEY_EXPERIMENTS = 'prompt_lab_experiments';
const STORAGE_KEY_FRAGMENTS = 'prompt_lab_fragments';
const STORAGE_KEY_CURRENT_EXP = 'prompt_lab_current_exp';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = Taro.getStorageSync(key);
    if (data !== '' && data !== undefined && data !== null) {
      return data as T;
    }
  } catch (e) {
    console.error('[Store] Load storage error:', e);
  }
  return fallback;
}

function saveToStorage(key: string, data: unknown) {
  try {
    Taro.setStorageSync(key, data);
  } catch (e) {
    console.error('[Store] Save storage error:', e);
  }
}

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

  addVariable: (experimentId: string, varName: string, defaultValue?: string) => void;
  renameVariable: (experimentId: string, oldName: string, newName: string) => void;
  deleteVariable: (experimentId: string, varName: string) => void;
  updateVariableDefault: (experimentId: string, varName: string, defaultValue: string) => void;

  addFragment: (frag: Fragment) => void;
  deleteFragment: (id: string) => void;
  toggleFragmentFavorite: (id: string) => void;
  incrementFragmentUsage: (id: string) => void;
  updateFragmentCategory: (id: string, category: string) => void;

  addVersion: (version: PromptVersion) => void;
  addSampleInput: (experimentId: string, input: SampleInput) => void;
  addRunResult: (experimentId: string, result: RunResult) => void;
  clearResults: (experimentId: string) => void;
  updateRunResultRating: (experimentId: string, resultId: string, rating: number) => void;
  addComment: (experimentId: string, comment: Experiment['comments'][0]) => void;
}

function recalcAvgRating(versions: PromptVersion[], results: RunResult[]): PromptVersion[] {
  return versions;
}

export const usePromptStore = create<PromptStore>((set, get) => {
  const initialExperiments = loadFromStorage<Experiment[]>(STORAGE_KEY_EXPERIMENTS, mockExperiments);
  const initialFragments = loadFromStorage<Fragment[]>(STORAGE_KEY_FRAGMENTS, mockFragments);
  const initialCurrentExp = loadFromStorage<string | null>(STORAGE_KEY_CURRENT_EXP, mockExperiments[0]?.id || null);

  const persist = () => {
    const state = get();
    saveToStorage(STORAGE_KEY_EXPERIMENTS, state.experiments);
    saveToStorage(STORAGE_KEY_FRAGMENTS, state.fragments);
    saveToStorage(STORAGE_KEY_CURRENT_EXP, state.currentExperimentId);
  };

  return {
    experiments: initialExperiments,
    fragments: initialFragments,
    currentExperimentId: initialCurrentExp,
    currentVersionId: null,
    pendingFragment: null,

    setCurrentExperiment: (id) => {
      set({ currentExperimentId: id });
      persist();
    },
    setCurrentVersion: (id) => set({ currentVersionId: id }),
    setPendingFragment: (content) => set({ pendingFragment: content }),

    addExperiment: (exp) => {
      set((state) => ({
        experiments: [exp, ...state.experiments],
        currentExperimentId: exp.id,
      }));
      persist();
    },

    updateExperiment: (id, updates) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        ),
      }));
      persist();
    },

    updateExperimentPrompt: (id, content, variables) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === id ? { ...e, promptContent: content, variables, updatedAt: new Date().toISOString() } : e
        ),
      }));
      persist();
    },

    rollbackToVersion: (experimentId, versionId) => {
      const state = get();
      const exp = state.experiments.find((e) => e.id === experimentId);
      const version = exp?.versions.find((v) => v.id === versionId);
      if (!exp || !version) return;

      const newVersionNum = exp.versions.length > 0 ? Math.max(...exp.versions.map(v => v.versionNumber)) + 1 : 1;
      const rollbackVersion: PromptVersion = {
        id: generateId(),
        experimentId,
        content: version.content,
        variables: version.variables,
        createdAt: new Date().toISOString(),
        avgRating: 0,
        runCount: 0,
        note: `回退到 v${version.versionNumber}`,
        versionNumber: newVersionNum,
      };

      set({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? {
                ...e,
                promptContent: version.content,
                variables: version.variables,
                versions: [rollbackVersion, ...e.versions],
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      });
      persist();
    },

    deleteExperiment: (id) => {
      set((state) => ({
        experiments: state.experiments.filter((e) => e.id !== id),
      }));
      persist();
    },

    addVariable: (experimentId, varName, defaultValue = '') => {
      set((state) => ({
        experiments: state.experiments.map((e) => {
          if (e.id !== experimentId) return e;
          const vars = [...e.variables];
          if (vars.some((v) => v.name === varName)) return e;
          vars.push({ name: varName, defaultValue });
          const newContent = e.promptContent + `\n{{${varName}}}`;
          const newSampleInputs = e.sampleInputs.map((s) => ({
            ...s,
            values: { ...s.values, [varName]: defaultValue },
          }));
          return { ...e, variables: vars, promptContent: newContent, sampleInputs: newSampleInputs, updatedAt: new Date().toISOString() };
        }),
      }));
      persist();
    },

    renameVariable: (experimentId, oldName, newName) => {
      if (oldName === newName) return;
      set((state) => ({
        experiments: state.experiments.map((e) => {
          if (e.id !== experimentId) return e;
          const vars = e.variables.map((v) =>
            v.name === oldName ? { ...v, name: newName } : v
          );
          const newContent = e.promptContent.replace(
            new RegExp(`\\{\\{${oldName}\\}\\}`, 'g'),
            `{{${newName}}}`
          );
          const newSampleInputs = e.sampleInputs.map((s) => {
            const newVals: Record<string, string> = {};
            for (const key of Object.keys(s.values)) {
              const newKey = key === oldName ? newName : key;
              newVals[newKey] = s.values[key];
            }
            return { ...s, values: newVals };
          });
          const newResults = e.results.map((r) => r);
          return { ...e, variables: vars, promptContent: newContent, sampleInputs: newSampleInputs, updatedAt: new Date().toISOString() };
        }),
      }));
      persist();
    },

    deleteVariable: (experimentId, varName) => {
      set((state) => ({
        experiments: state.experiments.map((e) => {
          if (e.id !== experimentId) return e;
          const vars = e.variables.filter((v) => v.name !== varName);
          const newContent = e.promptContent.replace(
            new RegExp(`\\{\\{${varName}\\}\\}\\n?`, 'g'),
            ''
          );
          const newSampleInputs = e.sampleInputs.map((s) => {
            const newVals: Record<string, string> = {};
            for (const key of Object.keys(s.values)) {
              if (key !== varName) newVals[key] = s.values[key];
            }
            return { ...s, values: newVals };
          });
          return { ...e, variables: vars, promptContent: newContent, sampleInputs: newSampleInputs, updatedAt: new Date().toISOString() };
        }),
      }));
      persist();
    },

    updateVariableDefault: (experimentId, varName, defaultValue) => {
      set((state) => ({
        experiments: state.experiments.map((e) => {
          if (e.id !== experimentId) return e;
          return {
            ...e,
            variables: e.variables.map((v) =>
              v.name === varName ? { ...v, defaultValue } : v
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      persist();
    },

    addFragment: (frag) => {
      set((state) => ({ fragments: [frag, ...state.fragments] }));
      persist();
    },

    deleteFragment: (id) => {
      set((state) => ({
        fragments: state.fragments.filter((f) => f.id !== id),
      }));
      persist();
    },

    toggleFragmentFavorite: (id) => {
      set((state) => ({
        fragments: state.fragments.map((f) =>
          f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
        ),
      }));
      persist();
    },

    incrementFragmentUsage: (id) => {
      set((state) => ({
        fragments: state.fragments.map((f) =>
          f.id === id ? { ...f, usageCount: f.usageCount + 1 } : f
        ),
      }));
      persist();
    },

    updateFragmentCategory: (id, category) => {
      set((state) => ({
        fragments: state.fragments.map((f) =>
          f.id === id ? { ...f, category } : f
        ),
      }));
      persist();
    },

    addVersion: (version) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === version.experimentId
            ? { ...e, versions: [version, ...e.versions] }
            : e
        ),
      }));
      persist();
    },

    addSampleInput: (experimentId, input) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? { ...e, sampleInputs: [...e.sampleInputs, input] }
            : e
        ),
      }));
      persist();
    },

    addRunResult: (experimentId, result) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? { ...e, results: [...e.results, result] }
            : e
        ),
      }));
      persist();
    },

    clearResults: (experimentId) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? { ...e, results: [] }
            : e
        ),
      }));
      persist();
    },

    updateRunResultRating: (experimentId, resultId, rating) => {
      set((state) => {
        const updatedExperiments = state.experiments.map((e) => {
          if (e.id !== experimentId) return e;
          const newResults = e.results.map((r) =>
            r.id === resultId ? { ...r, rating } : r
          );
          return { ...e, results: newResults };
        });
        return { experiments: updatedExperiments };
      });
      persist();
    },

    addComment: (experimentId, comment) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? { ...e, comments: [comment, ...e.comments] }
            : e
        ),
      }));
      persist();
    },
  };
});
