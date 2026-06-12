import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/store/usePromptStore';
import VersionItem from '@/components/VersionItem';
import VariableHighlight from '@/components/VariableHighlight';
import EmptyState from '@/components/EmptyState';
import { generateId } from '@/utils/helpers';
import type { Comment } from '@/types';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const VersionsPage = () => {
  const { experiments, currentExperimentId, rollbackToVersion, addComment } = usePromptStore();
  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const versions = currentExp?.versions || [];
  const allComments = currentExp?.comments || [];
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);
  const latestVersion = versions[0];

  const versionComments = useMemo(() => {
    if (!selectedVersion) return [];
    return allComments.filter(
      (c) => c.targetType === 'version' && c.targetId === selectedVersion.id
    );
  }, [allComments, selectedVersion]);

  const bestRating = useMemo(() => {
    if (versions.length === 0) return 0;
    return Math.max(...versions.map((v) => v.avgRating));
  }, [versions]);

  const handleRollback = (versionId: string) => {
    if (!currentExp) return;
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;
    Taro.showModal({
      title: '回退到历史版本',
      content: `确定要基于 v${version.versionNumber} 继续编辑吗？\n将跳转到编辑器，保存时会生成新版本。`,
      confirmText: '去编辑',
      success: (res) => {
        if (res.confirm) {
          rollbackToVersion(currentExp.id, versionId);
          setSelectedVersionId(null);
          Taro.showToast({ title: '已加载到编辑器', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/editor/index' });
          }, 500);
          console.info('[Versions] Rollback to version:', versionId);
        }
      },
    });
  };

  const handleAddVersionComment = () => {
    if (!currentExp || !selectedVersion) return;
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
      targetType: 'version',
      targetId: selectedVersion.id,
      versionNumber: selectedVersion.versionNumber,
    };
    addComment(currentExp.id, comment);
    setCommentText('');
    Taro.showToast({ title: '评论已发布', icon: 'success' });
    console.info('[Versions] Comment added to version:', selectedVersion.versionNumber);
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
              onRollback={index === 0 ? undefined : () => handleRollback(version.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          title="暂无版本记录"
          description="在编辑器中保存提示词后将自动生成版本记录"
        />
      )}

      {selectedVersion && (
        <View className={styles.detailModal} onClick={() => setSelectedVersionId(null)}>
          <View className={styles.detailContent} onClick={(e) => e.stopPropagation()}>
            <ScrollView scrollY style={{ maxHeight: '80vh' }}>
              <View className={styles.detailHeader}>
                <View className={styles.detailTitleRow}>
                  <Text className={styles.detailVersionTag}>v{selectedVersion.versionNumber}</Text>
                  <Text className={styles.detailTitle}>{selectedVersion.note}</Text>
                </View>
                <Text className={styles.detailClose} onClick={() => setSelectedVersionId(null)}>✕</Text>
              </View>

              {selectedVersion.baseVersionNumber && (
                <View className={styles.baseVersionHint}>
                  <Text className={styles.baseVersionHintText}>
                    🔄 从 v{selectedVersion.baseVersionNumber} 版本恢复
                  </Text>
                </View>
              )}

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
                <Text className={styles.detailMetaText}>
                  {dayjs(selectedVersion.createdAt).format('MM-DD HH:mm')}
                </Text>
              </View>

              {selectedVersion.id !== latestVersion?.id && (
                <View className={styles.rollbackAction} onClick={() => handleRollback(selectedVersion.id)}>
                  <Text className={styles.rollbackActionText}>📝 基于此版本编辑</Text>
                </View>
              )}

              <View className={styles.commentSection}>
                <Text className={styles.commentTitle}>版本评论 ({versionComments.length})</Text>
                {versionComments.length > 0 ? (
                  versionComments.map((comment) => (
                    <View key={comment.id} className={styles.commentItem}>
                      <View className={styles.commentAvatar}>
                        <Image className={styles.commentAvatarImg} src={comment.avatar} mode="aspectFill" />
                      </View>
                      <View className={styles.commentBody}>
                        <Text className={styles.commentAuthor}>{comment.author}</Text>
                        <Text className={styles.commentContent}>{comment.content}</Text>
                        <Text className={styles.commentTime}>
                          {dayjs(comment.createdAt).format('MM-DD HH:mm')}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text className={styles.commentEmpty}>还没有评论，来说两句吧~</Text>
                )}
                <View className={styles.commentInputRow}>
                  <Input
                    className={styles.commentInput}
                    placeholder="针对此版本发表评论..."
                    value={commentText}
                    onInput={(e) => setCommentText(e.detail.value)}
                  />
                  <View className={styles.commentSendBtn} onClick={handleAddVersionComment}>
                    <Text className={styles.commentSendText}>发送</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default VersionsPage;
