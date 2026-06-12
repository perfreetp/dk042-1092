import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Experiment, Fragment, PromptVersion, RunResult, SampleInput, Variable, Comment } from '@/types';
import { mockExperiments, mockFragments } from '@/data/experiments';
import { generateId, extractVariables } from '@/utils/helpers';

const STORAGE_KEY_EXPERIMENTS = 'prompt_lab_experiments';
const STORAGE_KEY_FRAGMENTS = 'prompt_lab_fragments';
const STORAGE_KEY_CURRENT_EXP = 'prompt_lab_current_exp';
const STORAGE_KEY_CATEGORIES = 'prompt_lab_categories';

const DEFAULT_CATEGORIES = ['角色设定', '输出格式', '约束条件', '语气风格', '分析框架', '功能模板'];

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
  categories: string[];
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

  addVersion: (experimentId: string, note: string) => PromptVersion | null;
  rollbackToVersion: (experimentId: string, versionId: string) => void;
  setBaseVersion: (experimentId: string, versionNumber: number | null) => void;

  addVariable: (experimentId: string, varName: string, defaultValue?: string) => void;
  renameVariable: (experimentId: string, oldName: string, newName: string) => void;
  deleteVariable: (experimentId: string, varName: string) => void;
  updateVariableDefault: (experimentId: string, varName: string, defaultValue: string) => void;

  addFragment: (frag: Fragment) => void;
  deleteFragment: (id: string) => void;
  toggleFragmentFavorite: (id: string) => void;
  incrementFragmentUsage: (id: string) => void;
  moveFragmentToCategory: (id: string, category: string) => void;

  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;

  addSampleInput: (experimentId: string, input: SampleInput) => void;
  addRunResult: (experimentId: string, result: RunResult) => void;
  clearResults: (experimentId: string) => void;
  updateRunResultRating: (experimentId: string, resultId: string, rating: number) => void;

  addComment: (experimentId: string, comment: Comment) => void;
}

export const usePromptStore = create<PromptStore>((set, get) => {
  const initialExperiments = loadFromStorage<Experiment[]>(STORAGE_KEY_EXPERIMENTS, mockExperiments);
  const initialFragments = loadFromStorage<Fragment[]>(STORAGE_KEY_FRAGMENTS, mockFragments);
  const initialCategories = loadFromStorage<string[]>(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
  const initialCurrentExp = loadFromStorage<string | null>(STORAGE_KEY_CURRENT_EXP, mockExperiments[0]?.id || null);

  const persist = () => {
    const state = get();
    saveToStorage(STORAGE_KEY_EXPERIMENTS, state.experiments);
    saveToStorage(STORAGE_KEY_FRAGMENTS, state.fragments);
    saveToStorage(STORAGE_KEY_CURRENT_EXP, state.currentExperimentId);
    saveToStorage(STORAGE_KEY_CATEGORIES, state.categories);
  };

  const getLatestVersion = (exp: Experiment): PromptVersion | null => {
    return exp.versions.length > 0 ? exp.versions[0] : null;
  };

  const getNextVersionNumber = (exp: Experiment): number => {
    if (exp.versions.length === 0) return 1;
    return Math.max(...exp.versions.map(v => v.versionNumber)) + 1;
  };

  return {
    experiments: initialExperiments,
    fragments: initialFragments,
    categories: initialCategories,
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

    addVersion: (experimentId, note) => {
      const state = get();
      const exp = state.experiments.find((e) => e.id === experimentId);
      if (!exp) return null;

      const versionNum = getNextVersionNumber(exp);
      const vars: Variable[] = extractVariables(exp.promptContent).map((v) => {
        const existing = exp.variables.find((ev) => ev.name === v);
        return { name: v, defaultValue: existing?.defaultValue || '' };
      });

      const newVersion: PromptVersion = {
        id: generateId(),
        experimentId,
        content: exp.promptContent,
        variables: vars,
        createdAt: new Date().toISOString(),
        avgRating: 0,
        runCount: 0,
        note: note || `v${versionNum}`,
        versionNumber: versionNum,
        baseVersionNumber: exp.baseVersionNumber ?? undefined,
      };

      set({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? {
                ...e,
                versions: [newVersion, ...e.versions],
                baseVersionNumber: undefined,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      });
      persist();
      return newVersion;
    },

    rollbackToVersion: (experimentId, versionId) => {
      const state = get();
      const exp = state.experiments.find((e) => e.id === experimentId);
      const version = exp?.versions.find((v) => v.id === versionId);
      if (!exp || !version) return;

      set({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? {
                ...e,
                promptContent: version.content,
                variables: version.variables,
                baseVersionNumber: version.versionNumber,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      });
      persist();
    },

    setBaseVersion: (experimentId, versionNumber) => {
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === experimentId
            ? { ...e, baseVersionNumber: versionNumber ?? undefined }
            : e
        ),
      }));
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

    moveFragmentToCategory: (id, category) => {
      set((state) => ({
        fragments: state.fragments.map((f) =>
          f.id === id ? { ...f, category } : f
        ),
      }));
      persist();
    },

    addCategory: (name) => {
      if (!name.trim()) return;
      const state = get();
      if (state.categories.includes(name.trim())) return;
      set((state) => ({ categories: [...state.categories, name.trim()] }));
      persist();
    },

    renameCategory: (oldName, newName) => {
      if (!newName.trim() || oldName === newName.trim()) return;
      const state = get();
      if (state.categories.includes(newName.trim())) return;
      set({
        categories: state.categories.map((c) => (c === oldName ? newName.trim() : c)),
        fragments: state.fragments.map((f) =>
          f.category === oldName ? { ...f, category: newName.trim() } : f
        ),
      });
      persist();
    },

    deleteCategory: (name) => {
      const state = get();
      set({
        categories: state.categories.filter((c) => c !== name),
        fragments: state.fragments.map((f) =>
          f.category === name ? { ...f, category: '其他' } : f
        ),
      });
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
      set((state) => {
        const updatedExperiments = state.experiments.map((e) => {
          if (e.id !== experimentId) return e;
          const newResults = [...e.results, result];
          const updatedVersions = e.versions.map((v) => {
            if (v.id !== result.versionId) return v;
            const vResults = newResults.filter((r) => r.versionId === v.id);
            const rated = vResults.filter((r) => r.rating > 0);
            const avgRating = rated.length > 0
              ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
              : 0;
            return { ...v, runCount: vResults.length, avgRating };
          });
          return { ...e, results: newResults, versions: updatedVersions };
        });
        return { experiments: updatedExperiments };
      });
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
          const updatedVersions = e.versions.map((v) => {
            const vResults = newResults.filter((r) => r.versionId === v.id);
            if (vResults.length === 0) return v;
            const rated = vResults.filter((r) => r.rating > 0);
            const avgRating = rated.length > 0
              ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
              : 0;
            return { ...v, runCount: vResults.length, avgRating };
          });
          return { ...e, results: newResults, versions: updatedVersions };
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
