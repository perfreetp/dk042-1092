import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePromptStore } from '@/store/usePromptStore';
import VersionItem from '@/components/VersionItem';
import VariableHighlight from '@/components/VariableHighlight';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const VersionsPage = () => {
  const { experiments, currentExperimentId } = usePromptStore();
  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const versions = currentExp?.versions || [];
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  const bestRating = useMemo(() => {
    if (versions.length === 0) return 0;
    return Math.max(...versions.map((v) => v.avgRating));
  }, [versions]);

  const handleRollback = (versionId: string) => {
    console.info('[Versions] Rollback to version:', versionId);
    setSelectedVersionId(null);
  };

  return (
    <View className={styles.page}>
      <View className={styles.expSelector}>
        <Text className={styles.expName}>{currentExp?.name || '选择实验'}</Text>
        <Text className={styles.expArrow}>▼</Text>
      </View>

      <View className={styles.versionStats}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{versions.length}</Text>
          <Text className={styles.statLabel}>总版本</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{bestRating.toFixed(1)}</Text>
          <Text className={styles.statLabel}>最高评分</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>
            {versions.reduce((sum, v) => sum + v.runCount, 0)}
          </Text>
          <Text className={styles.statLabel}>总试跑</Text>
        </View>
      </View>

      {versions.length > 0 ? (
        <ScrollView scrollY className={styles.timelineContainer} style={{ height: 'calc(100vh - 360rpx)' }}>
          {versions.map((version, index) => (
            <VersionItem
              key={version.id}
              version={version}
              isCurrent={index === 0}
              isLatest={index === 0}
              onClick={() => setSelectedVersionId(version.id)}
              onRollback={() => handleRollback(version.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          title="暂无版本记录"
          description="保存提示词后将自动生成版本记录"
        />
      )}

      {selectedVersion && (
        <View className={styles.detailModal} onClick={() => setSelectedVersionId(null)}>
          <View className={styles.detailContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.detailHeader}>
              <Text className={styles.detailTitle}>{selectedVersion.note || '版本详情'}</Text>
              <Text className={styles.detailClose} onClick={() => setSelectedVersionId(null)}>✕</Text>
            </View>
            <View className={styles.detailPrompt}>
              <VariableHighlight text={selectedVersion.content} />
            </View>
            <View className={styles.detailVars}>
              {selectedVersion.variables.map((v) => (
                <View key={v.name} className={styles.detailVar}>
                  <Text className={styles.detailVarText}>{v.name}</Text>
                </View>
              ))}
            </View>
            <View className={styles.detailMeta}>
              <Text className={styles.detailMetaText}>评分 {selectedVersion.avgRating.toFixed(1)}</Text>
              <Text className={styles.detailMetaText}>试跑 {selectedVersion.runCount} 次</Text>
              <Text className={styles.detailMetaText}>{selectedVersion.createdAt}</Text>
            </View>
            <View className={styles.rollbackAction} onClick={() => handleRollback(selectedVersion.id)}>
              <Text className={styles.rollbackActionText}>回退到此版本</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default VersionsPage;
