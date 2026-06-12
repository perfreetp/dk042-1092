import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, Textarea, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/store/usePromptStore';
import { detectSensitiveWords, extractVariables, generateId, fillVariables } from '@/utils/helpers';
import type { SensitiveWord, Variable, SampleInput, PromptVersion, RunResult } from '@/types';
import styles from './index.module.scss';

const MOCK_RESPONSES = [
  '好的，让我为您分析一下。根据您提供的信息，这是一个值得深入探讨的话题。',
  '感谢您的提问！以下是详细的解答，希望对您有所帮助。',
  '根据您描述的情况，我建议可以从以下几个方面入手考虑。',
  '这是一个很好的问题。让我从专业角度为您分析，帮助您做出更好的决策。',
  '了解您的需求后，我为您整理了以下要点和建议，供参考。',
];

const EditorPage = () => {
  const {
    experiments, currentExperimentId, fragments,
    addVersion, addSampleInput, addRunResult, clearResults,
    updateExperimentPrompt, updateExperiment,
    pendingFragment, setPendingFragment,
  } = usePromptStore();

  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];

  const [promptContent, setPromptContent] = useState(currentExp?.promptContent || '');
  const [variableDefaults, setVariableDefaults] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    currentExp?.variables?.forEach((v) => { defaults[v.name] = v.defaultValue; });
    return defaults;
  });
  const [showAddSample, setShowAddSample] = useState(false);
  const [sampleName, setSampleName] = useState('');
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (currentExp) {
      setPromptContent(currentExp.promptContent || '');
      const defaults: Record<string, string> = {};
      currentExp.variables?.forEach((v) => { defaults[v.name] = v.defaultValue; });
      setVariableDefaults(defaults);
    }
  }, [currentExp?.id]);

  useEffect(() => {
    if (pendingFragment) {
      setPromptContent((prev) => prev + '\n' + pendingFragment);
      setPendingFragment(null);
      console.info('[Editor] Fragment inserted from library');
    }
  }, [pendingFragment]);

  const variables = useMemo(() => extractVariables(promptContent), [promptContent]);
  const sensitiveWords = useMemo(() => detectSensitiveWords(promptContent), [promptContent]);

  const handlePromptChange = (value: string) => {
    setPromptContent(value);
    const newVars = extractVariables(value);
    setVariableDefaults((prev) => {
      const updated = { ...prev };
      newVars.forEach((v) => {
        if (!(v in updated)) { updated[v] = ''; }
      });
      return updated;
    });
  };

  const handleVariableDefault = (varName: string, value: string) => {
    setVariableDefaults((prev) => ({ ...prev, [varName]: value }));
  };

  const handleInsertFragment = (content: string) => {
    setPromptContent((prev) => prev + '\n' + content);
    console.info('[Editor] Fragment inserted');
  };

  const handleSaveVersion = () => {
    if (!currentExp) return;
    const vars: Variable[] = variables.map((v) => ({ name: v, defaultValue: variableDefaults[v] || '' }));
    const version: PromptVersion = {
      id: generateId(),
      experimentId: currentExp.id,
      content: promptContent,
      variables: vars,
      createdAt: new Date().toISOString(),
      avgRating: 0,
      runCount: 0,
      note: `版本 ${currentExp.versions.length + 1}`,
    };
    addVersion(version);
    updateExperimentPrompt(currentExp.id, promptContent, vars);
    Taro.showToast({ title: '版本已保存', icon: 'success' });
    console.info('[Editor] Version saved:', version.id);
  };

  const handleAddSample = () => {
    if (!currentExp) return;
    if (!sampleName.trim()) {
      Taro.showToast({ title: '请输入样例名称', icon: 'none' });
      return;
    }
    const missingVar = variables.find((v) => !sampleValues[v]?.trim());
    if (missingVar) {
      Taro.showToast({ title: `请填写变量 ${missingVar}`, icon: 'none' });
      return;
    }
    const input: SampleInput = {
      id: generateId(),
      name: sampleName.trim(),
      values: { ...sampleValues },
    };
    addSampleInput(currentExp.id, input);
    setShowAddSample(false);
    setSampleName('');
    setSampleValues({});
    Taro.showToast({ title: '样例已添加', icon: 'success' });
    console.info('[Editor] Sample added:', input.id);
  };

  const handleBatchRun = useCallback(() => {
    if (!currentExp) return;
    if (currentExp.sampleInputs.length === 0) {
      Taro.showToast({ title: '请先添加示例输入', icon: 'none' });
      return;
    }
    setIsRunning(true);
    clearResults(currentExp.id);

    setTimeout(() => {
      currentExp.sampleInputs.forEach((sample) => {
        const filled = fillVariables(promptContent, sample.values);
        const responseIdx = Math.floor(Math.random() * MOCK_RESPONSES.length);
        const result: RunResult = {
          id: generateId(),
          sampleInputId: sample.id,
          sampleName: sample.name,
          output: `[模拟回答] ${MOCK_RESPONSES[responseIdx]}\n\n基于提示词生成的回复（样例：${sample.name}）`,
          rating: 0,
          createdAt: new Date().toISOString(),
        };
        addRunResult(currentExp.id, result);
      });

      updateExperiment(currentExp.id, { status: 'testing' });
      setIsRunning(false);
      Taro.showToast({ title: '试跑完成', icon: 'success' });
      console.info('[Editor] Batch run completed');
    }, 1500);
  }, [currentExp, promptContent]);

  const topFragments = fragments.slice(0, 6);

  const openAddSample = () => {
    const initValues: Record<string, string> = {};
    variables.forEach((v) => { initValues[v] = ''; });
    setSampleValues(initValues);
    setSampleName('');
    setShowAddSample(true);
  };

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>提示词内容</Text>
          <Text className={styles.sectionAction}>{currentExp?.name || ''}</Text>
        </View>
        <View className={styles.editorCard}>
          <Textarea
            className={styles.textarea}
            placeholder="输入提示词，使用 {{变量名}} 标记变量占位..."
            value={promptContent}
            onInput={(e) => handlePromptChange(e.detail.value)}
            maxlength={-1}
            autoHeight
          />
          <Text className={styles.charCount}>{promptContent.length} 字</Text>
          {sensitiveWords.length > 0 && (
            <View className={styles.sensitiveAlert}>
              <Text className={styles.sensitiveIcon}>⚠️</Text>
              <View className={styles.sensitiveContent}>
                <Text className={styles.sensitiveTitle}>检测到敏感词</Text>
                <View className={styles.sensitiveWords}>
                  {sensitiveWords.map((sw: SensitiveWord) => (
                    <View key={sw.word} className={styles.sensitiveWordTag}>
                      <Text className={styles.sensitiveWordText}>{sw.word}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>变量 ({variables.length})</Text>
        </View>
        <View className={styles.variablesCard}>
          {variables.length > 0 ? (
            <View className={styles.variableList}>
              {variables.map((varName) => (
                <View key={varName} className={styles.variableItem}>
                  <Text className={styles.variableName}>{varName}</Text>
                  <Input
                    className={styles.variableInput}
                    placeholder="默认值"
                    value={variableDefaults[varName] || ''}
                    onInput={(e) => handleVariableDefault(varName, e.detail.value)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: '24rpx', color: '#8e8ea0' }}>在提示词中使用 {'{{变量名}}'} 来定义变量</Text>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>示例输入 ({currentExp?.sampleInputs?.length || 0})</Text>
          <Text className={styles.sectionAction} onClick={openAddSample}>+ 新增</Text>
        </View>
        <View className={styles.samplesCard}>
          {currentExp?.sampleInputs?.map((sample) => (
            <View key={sample.id} className={styles.sampleItem}>
              <Text className={styles.sampleName}>{sample.name}</Text>
              <Text className={styles.sampleValues}>
                {Object.values(sample.values).join('、')}
              </Text>
            </View>
          ))}
          <View className={styles.addSampleBtn} onClick={openAddSample}>
            <Text className={styles.addSampleText}>+ 添加示例输入</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>常用片段</Text>
          <Text className={styles.sectionAction}>查看全部</Text>
        </View>
        <ScrollView scrollX className={styles.fragmentsScroll}>
          {topFragments.map((frag) => (
            <View
              key={frag.id}
              className={styles.fragmentItem}
              onClick={() => handleInsertFragment(frag.content)}
            >
              <Text className={styles.fragmentText}>{frag.title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.saveBtn} onClick={handleSaveVersion}>
          <Text className={styles.saveBtnText}>保存版本</Text>
        </View>
        <View className={styles.runBtn} onClick={handleBatchRun}>
          <Text className={styles.runBtnText}>{isRunning ? '试跑中...' : '批量试跑'}</Text>
        </View>
      </View>

      {showAddSample && (
        <View className={styles.modal} onClick={() => setShowAddSample(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>添加示例输入</Text>
              <Text className={styles.modalClose} onClick={() => setShowAddSample(false)}>✕</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>样例名称</Text>
              <Input
                className={styles.formInput}
                placeholder="例如：退款咨询"
                value={sampleName}
                onInput={(e) => setSampleName(e.detail.value)}
              />
            </View>
            {variables.map((varName) => (
              <View key={varName} className={styles.formGroup}>
                <Text className={styles.formLabel}>{varName}</Text>
                <Input
                  className={styles.formInput}
                  placeholder={`输入 ${varName} 的值`}
                  value={sampleValues[varName] || ''}
                  onInput={(e) => setSampleValues((prev) => ({ ...prev, [varName]: e.detail.value }))}
                />
              </View>
            ))}
            <View className={styles.confirmBtn} onClick={handleAddSample}>
              <Text className={styles.confirmBtnText}>确认添加</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default EditorPage;
