import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { usePromptStore } from '@/store/usePromptStore';
import ResultCard from '@/components/ResultCard';
import EmptyState from '@/components/EmptyState';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const VIEW_TABS = [
  { key: 'list', label: '列表' },
  { key: 'compare', label: '对比' },
];

const ResultsPage = () => {
  const { experiments, currentExperimentId, updateRunResultRating } = usePromptStore();
  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];
  const [viewMode, setViewMode] = useState('list');

  const results = currentExp?.results || [];
  const comments = currentExp?.comments || [];

  const avgRating = useMemo(() => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.rating, 0);
    return (total / results.length).toFixed(1);
  }, [results]);

  const handleRate = (resultId: string, rating: number) => {
    if (currentExp) {
      updateRunResultRating(currentExp.id, resultId, rating);
      console.info('[Results] Rated:', resultId, rating);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.overviewCard}>
        <View className={styles.overviewHeader}>
          <Text className={styles.overviewTitle}>{currentExp?.name || '试跑结果'}</Text>
          <View className={styles.runBtn}>
            <Text className={styles.runBtnText}>重新试跑</Text>
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
          <ScrollView scrollY className={styles.resultsList} style={{ height: 'calc(100vh - 500rpx)' }}>
            {results.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                onRate={(rating) => handleRate(result.id, rating)}
              />
            ))}
          </ScrollView>
        ) : (
          <ScrollView scrollY className={styles.compareMode} style={{ height: 'calc(100vh - 500rpx)' }}>
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

      {comments.length > 0 && (
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
        </View>
      )}

      <View className={styles.exportBtn}>
        <Text className={styles.exportBtnText}>导出分享结果</Text>
      </View>
    </View>
  );
};

export default ResultsPage;
