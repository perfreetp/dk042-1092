import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Input, Image, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/store/usePromptStore';
import ResultCard from '@/components/ResultCard';
import EmptyState from '@/components/EmptyState';
import { generateId, extractVariables } from '@/utils/helpers';
import type { RunResult, Comment } from '@/types';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const MOCK_RESPONSES = [
  '好的，让我为您分析一下。根据您提供的信息，这是一个值得深入探讨的话题。',
  '感谢您的提问！以下是详细的解答，希望对您有所帮助。',
  '根据您描述的情况，我建议可以从以下几个方面入手考虑。',
  '这是一个很好的问题。让我从专业角度为您分析，帮助您做出更好的决策。',
  '了解您的需求后，我为您整理了以下要点和建议，供参考。',
];

const VIEW_TABS = [
  { key: 'list', label: '列表' },
  { key: 'compare', label: '对比' },
];

const ResultsPage = () => {
  const {
    experiments, currentExperimentId,
    updateRunResultRating, addRunResult, clearResults, addComment,
    updateExperiment,
  } = usePromptStore();
  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];
  const [viewMode, setViewMode] = useState('list');
  const [commentText, setCommentText] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const results = currentExp?.results || [];
  const comments = currentExp?.comments || [];

  const avgRating = useMemo(() => {
    const rated = results.filter((r) => r.rating > 0);
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, r) => sum + r.rating, 0);
    return (total / rated.length).toFixed(1);
  }, [results]);

  const handleRate = (resultId: string, rating: number) => {
    if (currentExp) {
      updateRunResultRating(currentExp.id, resultId, rating);
      console.info('[Results] Rated:', resultId, rating);
    }
  };

  const handleRerun = useCallback(() => {
    if (!currentExp || currentExp.sampleInputs.length === 0) {
      Taro.showToast({ title: '请先在编辑器中添加示例输入', icon: 'none' });
      return;
    }
    setIsRunning(true);
    clearResults(currentExp.id);

    setTimeout(() => {
      const vars = extractVariables(currentExp.promptContent);
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
      console.info('[Results] Rerun completed');
    }, 1500);
  }, [currentExp]);

  const handleExport = () => {
    if (!currentExp || results.length === 0) return;
    let text = `📋 提示词实验：${currentExp.name}\n`;
    text += `━━━━━━━━━━━━━\n`;
    text += `📝 提示词：\n${currentExp.promptContent}\n\n`;
    results.forEach((r, i) => {
      text += `🧪 样例 ${i + 1}：${r.sampleName}\n`;
      text += `⭐ 评分：${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}\n`;
      text += `💬 回答：${r.output}\n\n`;
    });
    text += `📊 平均评分：${avgRating}\n`;
    Taro.setClipboardData({ data: text }).then(() => {
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
    }).catch((err) => {
      console.error('[Results] Copy failed:', err);
      Taro.showToast({ title: '复制失败', icon: 'none' });
    });
  };

  const handleAddComment = () => {
    if (!currentExp) return;
    if (!commentText.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    const comment: Comment = {
      id: generateId(),
      author: '我',
      avatar: 'https://picsum.photos/id/1027/200/200',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    addComment(currentExp.id, comment);
    setCommentText('');
    Taro.showToast({ title: '评论已发布', icon: 'success' });
    console.info('[Results] Comment added:', comment.id);
  };

  return (
    <View className={styles.page}>
      <View className={styles.overviewCard}>
        <View className={styles.overviewHeader}>
          <Text className={styles.overviewTitle}>{currentExp?.name || '试跑结果'}</Text>
          <View className={styles.runBtn} onClick={handleRerun}>
            <Text className={styles.runBtnText}>{isRunning ? '试跑中...' : '重新试跑'}</Text>
          </View>
        </View>
        <View className={styles.overviewStats}>
          <View className={styles.overviewStatItem}>
            <Text className={styles.overviewStatValue}>{results.length}</Text>
            <Text className={styles.overviewStatLabel}>试跑次数</Text>
          </View>
          <View className={styles.overviewStatItem}>
            <Text className={styles.overviewStatValue}>{avgRating}</Text>
            <Text className={styles.overviewStatLabel}>平均评分</Text>
          </View>
          <View className={styles.overviewStatItem}>
            <Text className={styles.overviewStatValue}>{currentExp?.versions?.length || 0}</Text>
            <Text className={styles.overviewStatLabel}>版本数</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        {VIEW_TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tab, viewMode === tab.key && styles.tabActive)}
            onClick={() => setViewMode(tab.key)}
          >
            <Text className={classnames(styles.tabText, viewMode === tab.key && styles.tabActiveText)}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {results.length > 0 ? (
        viewMode === 'list' ? (
          <ScrollView scrollY className={styles.resultsList} style={{ height: 'calc(100vh - 660rpx)' }}>
            {results.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                onRate={(rating) => handleRate(result.id, rating)}
              />
            ))}
          </ScrollView>
        ) : (
          <ScrollView scrollY className={styles.compareMode} style={{ height: 'calc(100vh - 660rpx)' }}>
            {results.map((result) => (
              <View key={result.id} className={styles.compareCard}>
                <View className={styles.compareHeader}>
                  <Text className={styles.compareName}>{result.sampleName}</Text>
                </View>
                <Text className={styles.compareOutput}>{result.output}</Text>
              </View>
            ))}
          </ScrollView>
        )
      ) : (
        <EmptyState
          title="暂无试跑结果"
          description="在编辑器中点击「批量试跑」查看结果"
        />
      )}

      <View className={styles.commentSection}>
        <Text className={styles.commentTitle}>团队评论</Text>
        {comments.map((comment) => (
          <View key={comment.id} className={styles.commentItem}>
            <View className={styles.commentAvatar}>
              <Image className={styles.commentAvatarImg} src={comment.avatar} mode="aspectFill" />
            </View>
            <View className={styles.commentBody}>
              <Text className={styles.commentAuthor}>{comment.author}</Text>
              <Text className={styles.commentContent}>{comment.content}</Text>
              <Text className={styles.commentTime}>{dayjs(comment.createdAt).format('MM-DD HH:mm')}</Text>
            </View>
          </View>
        ))}
        <View className={styles.commentInput}>
          <Input
            className={styles.commentInputField}
            placeholder="输入评论..."
            value={commentText}
            onInput={(e) => setCommentText(e.detail.value)}
          />
          <View className={styles.commentSendBtn} onClick={handleAddComment}>
            <Text className={styles.commentSendText}>发送</Text>
          </View>
        </View>
      </View>

      <View className={styles.exportBtn} onClick={handleExport}>
        <Text className={styles.exportBtnText}>导出分享结果</Text>
      </View>
    </View>
  );
};

export default ResultsPage;
