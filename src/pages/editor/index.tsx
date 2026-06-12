import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Textarea, Input, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
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
    addVariable, renameVariable, deleteVariable, updateVariableDefault,
  } = usePromptStore();

  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];

  const [promptContent, setPromptContent] = useState(currentExp?.promptContent || '');
  const [showAddSample, setShowAddSample] = useState(false);
  const [sampleName, setSampleName] = useState('');
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);

  const [showVarMenu, setShowVarMenu] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameOldName, setRenameOldName] = useState('');
  const [renameNewName, setRenameNewName] = useState('');
  const [showAddVarModal, setShowAddVarModal] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarDefault, setNewVarDefault] = useState('');

  const [insertFlash, setInsertFlash] = useState(false);

  const lastUpdateAt = useRef(currentExp?.updatedAt || '');

  useEffect(() => {
    if (currentExp && currentExp.updatedAt !== lastUpdateAt.current) {
      setPromptContent(currentExp.promptContent || '');
      lastUpdateAt.current = currentExp.updatedAt;
      console.info('[Editor] Synced with store update');
    }
  }, [currentExp?.updatedAt]);

  useEffect(() => {
    if (pendingFragment) {
      setPromptContent((prev) => prev + '\n' + pendingFragment);
      setPendingFragment(null);
      setInsertFlash(true);
      setTimeout(() => setInsertFlash(false), 1500);
      Taro.showToast({ title: '片段已插入到末尾', icon: 'none' });
      console.info('[Editor] Fragment inserted from library');
    }
  }, [pendingFragment]);

  const variables = useMemo(() => extractVariables(promptContent), [promptContent]);
  const sensitiveWords = useMemo(() => detectSensitiveWords(promptContent), [promptContent]);
  const favoriteFragments = useMemo(() => fragments.filter((f) => f.isFavorite), [fragments]);

  const handlePromptChange = (value: string) => {
    setPromptContent(value);
  };

  const handleInsertFragment = (content: string, title: string) => {
    setPromptContent((prev) => prev + '\n' + content);
    setInsertFlash(true);
    setTimeout(() => setInsertFlash(false), 1500);
    Taro.showToast({ title: `已插入「${title}」到末尾`, icon: 'none' });
    console.info('[Editor] Fragment inserted:', title);
  };

  const handleSaveVersion = () => {
    if (!currentExp) return;
    const vars: Variable[] = variables.map((v) => {
      const existing = currentExp.variables.find((ev) => ev.name === v);
      return { name: v, defaultValue: existing?.defaultValue || '' };
    });
    const nextVersionNum = currentExp.versions.length > 0
      ? Math.max(...currentExp.versions.map(v => v.versionNumber)) + 1
      : 1;
    const version: PromptVersion = {
      id: generateId(),
      experimentId: currentExp.id,
      content: promptContent,
      variables: vars,
      createdAt: new Date().toISOString(),
      avgRating: 0,
      runCount: 0,
      note: `版本 ${nextVersionNum}`,
      versionNumber: nextVersionNum,
    };
    addVersion(version);
    updateExperimentPrompt(currentExp.id, promptContent, vars);
    lastUpdateAt.current = new Date().toISOString();
    Taro.showToast({ title: `v${nextVersionNum} 已保存`, icon: 'success' });
    console.info('[Editor] Version saved:', version.id);
  };

  const openAddSample = () => {
    const initValues: Record<string, string> = {};
    variables.forEach((v) => { initValues[v] = ''; });
    setSampleValues(initValues);
    setSampleName('');
    setShowAddSample(true);
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

  const handleBatchRun = () => {
    if (!currentExp) return;
    if (currentExp.sampleInputs.length === 0) {
      Taro.showToast({ title: '请先添加示例输入', icon: 'none' });
      return;
    }
    setIsRunning(true);
    clearResults(currentExp.id);

    setTimeout(() => {
      currentExp.sampleInputs.forEach((sample) => {
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
  };

  const openRenameVar = (oldName: string) => {
    setRenameOldName(oldName);
    setRenameNewName(oldName);
    setShowVarMenu(null);
    setShowRenameModal(true);
  };

  const handleRenameVar = () => {
    if (!currentExp) return;
    if (!renameNewName.trim() || renameNewName === renameOldName) {
      setShowRenameModal(false);
      return;
    }
    if (!/^\w+$/.test(renameNewName)) {
      Taro.showToast({ title: '变量名只能是字母数字下划线', icon: 'none' });
      return;
    }
    if (variables.includes(renameNewName)) {
      Taro.showToast({ title: '变量名已存在', icon: 'none' });
      return;
    }
    renameVariable(currentExp.id, renameOldName, renameNewName.trim());
    lastUpdateAt.current = new Date().toISOString();
    setShowRenameModal(false);
    Taro.showToast({ title: '变量已重命名', icon: 'success' });
  };

  const handleDeleteVar = (varName: string) => {
    if (!currentExp) return;
    setShowVarMenu(null);
    Taro.showModal({
      title: '删除变量',
      content: `确定要删除变量「${varName}」吗？提示词和样例中相关内容会同步移除。`,
      success: (res) => {
        if (res.confirm) {
          deleteVariable(currentExp.id, varName);
          lastUpdateAt.current = new Date().toISOString();
          Taro.showToast({ title: '变量已删除', icon: 'success' });
        }
      },
    });
  };

  const handleAddVar = () => {
    if (!currentExp) return;
    if (!newVarName.trim()) {
      Taro.showToast({ title: '请输入变量名', icon: 'none' });
      return;
    }
    if (!/^\w+$/.test(newVarName)) {
      Taro.showToast({ title: '变量名只能是字母数字下划线', icon: 'none' });
      return;
    }
    if (variables.includes(newVarName.trim())) {
      Taro.showToast({ title: '变量名已存在', icon: 'none' });
      return;
    }
    addVariable(currentExp.id, newVarName.trim(), newVarDefault.trim());
    lastUpdateAt.current = new Date().toISOString();
    setShowAddVarModal(false);
    setNewVarName('');
    setNewVarDefault('');
    Taro.showToast({ title: '变量已添加', icon: 'success' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>提示词内容</Text>
          <Text className={styles.sectionAction}>{currentExp?.name || ''}</Text>
        </View>
        <View className={classnames(styles.editorCard, insertFlash && styles.editorFlash)}>
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
          <Text className={styles.sectionTitle}>变量管理 ({variables.length})</Text>
          <Text className={styles.sectionAction} onClick={() => setShowAddVarModal(true)}>+ 新增变量</Text>
        </View>
        <View className={styles.variablesCard}>
          {variables.length > 0 ? (
            <View className={styles.variableList}>
              {variables.map((varName) => {
                const varInfo = currentExp?.variables?.find((v) => v.name === varName);
                return (
                  <View key={varName} className={styles.variableItem}>
                    <View className={styles.varMain}>
                      <Text className={styles.variableName}>{varName}</Text>
                      <Input
                        className={styles.variableInput}
                        placeholder="默认值"
                        value={varInfo?.defaultValue || ''}
                        onInput={(e) => updateVariableDefault(currentExp?.id || '', varName, e.detail.value)}
                      />
                    </View>
                    <View className={styles.varActions}>
                      <Text
                        className={styles.varActionBtn}
                        onClick={() => openRenameVar(varName)}
                      >
                        ✎
                      </Text>
                      <Text
                        className={styles.varActionBtn}
                        onClick={() => handleDeleteVar(varName)}
                      >
                        ✕
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontSize: '24rpx', color: '#8e8ea0' }}>
              在提示词中使用 {'{{变量名}}'} 或点上方「+ 新增变量」来添加
            </Text>
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
          <Text className={styles.sectionTitle}>收藏片段</Text>
          <Text className={styles.sectionAction}>全部</Text>
        </View>
        {favoriteFragments.length > 0 ? (
          <ScrollView scrollX className={styles.fragmentsScroll}>
            {favoriteFragments.map((frag) => (
              <View
                key={frag.id}
                className={styles.fragmentFavorite}
                onClick={() => handleInsertFragment(frag.content, frag.title)}
              >
                <Text className={styles.fragmentFavIcon}>⭐</Text>
                <Text className={styles.fragmentFavText}>{frag.title}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ fontSize: '24rpx', color: '#8e8ea0', paddingLeft: '8rpx' }}>
            还没有收藏片段，去素材库添加吧~
          </Text>
        )}
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

      {showAddVarModal && (
        <View className={styles.modal} onClick={() => setShowAddVarModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>新增变量</Text>
              <Text className={styles.modalClose} onClick={() => setShowAddVarModal(false)}>✕</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>变量名</Text>
              <Input
                className={styles.formInput}
                placeholder="例如：customer_question"
                value={newVarName}
                onInput={(e) => setNewVarName(e.detail.value)}
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>默认值（可选）</Text>
              <Input
                className={styles.formInput}
                placeholder="变量的默认值"
                value={newVarDefault}
                onInput={(e) => setNewVarDefault(e.detail.value)}
              />
            </View>
            <View className={styles.confirmBtn} onClick={handleAddVar}>
              <Text className={styles.confirmBtnText}>确认添加</Text>
            </View>
          </View>
        </View>
      )}

      {showRenameModal && (
        <View className={styles.modal} onClick={() => setShowRenameModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>重命名变量</Text>
              <Text className={styles.modalClose} onClick={() => setShowRenameModal(false)}>✕</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>原变量名</Text>
              <View className={styles.formInput} style={{ lineHeight: '80rpx', color: '#8e8ea0' }}>{renameOldName}</View>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>新变量名</Text>
              <Input
                className={styles.formInput}
                placeholder="输入新变量名"
                value={renameNewName}
                onInput={(e) => setRenameNewName(e.detail.value)}
              />
            </View>
            <Text style={{ fontSize: '22rpx', color: '#8e8ea0', marginBottom: '24rpx' }}>
              重命名后，提示词占位、默认值和样例输入会同步更新
            </Text>
            <View className={styles.confirmBtn} onClick={handleRenameVar}>
              <Text className={styles.confirmBtnText}>确认重命名</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default EditorPage;
