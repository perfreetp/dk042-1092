import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Input, ScrollView } from '@tarojs/components';
import { usePromptStore } from '@/store/usePromptStore';
import { detectSensitiveWords, extractVariables } from '@/utils/helpers';
import type { SensitiveWord } from '@/types';
import styles from './index.module.scss';

const EditorPage = () => {
  const { experiments, currentExperimentId, fragments } = usePromptStore();
  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];

  const [promptContent, setPromptContent] = useState(currentExp?.promptContent || '');
  const [variableDefaults, setVariableDefaults] = useState<Record<string, string>>(
    () => {
      const defaults: Record<string, string> = {};
      currentExp?.variables?.forEach((v) => {
        defaults[v.name] = v.defaultValue;
      });
      return defaults;
    }
  );

  const variables = useMemo(() => extractVariables(promptContent), [promptContent]);
  const sensitiveWords = useMemo(() => detectSensitiveWords(promptContent), [promptContent]);

  const handlePromptChange = (value: string) => {
    setPromptContent(value);
    const newVars = extractVariables(value);
    setVariableDefaults((prev) => {
      const updated = { ...prev };
      newVars.forEach((v) => {
        if (!(v in updated)) {
          updated[v] = '';
        }
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

  const topFragments = fragments.slice(0, 6);

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>提示词内容</Text>
          <Text className={styles.sectionAction}>预览</Text>
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
          <Text className={styles.sectionAction}>+ 新增</Text>
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
          <View className={styles.addSampleBtn}>
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
        <View className={styles.saveBtn}>
          <Text className={styles.saveBtnText}>保存版本</Text>
        </View>
        <View className={styles.runBtn}>
          <Text className={styles.runBtnText}>批量试跑</Text>
        </View>
      </View>
    </View>
  );
};

export default EditorPage;
