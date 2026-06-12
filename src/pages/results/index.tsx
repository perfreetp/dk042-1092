import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Textarea, Image, ScrollView, Picker } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/store/usePromptStore';
import StarRating from '@/components/StarRating';
import EmptyState from '@/components/EmptyState';
import { generateId } from '@/utils/helpers';
import type { RunResult, Comment, RecommendedVersion } from '@/types';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const MOCK_RESPONSES = [
  '好的，让我为您分析一下。根据您提供的信息，这是一个值得深入探讨的话题。',
  '感谢您的提问！以下是详细的解答，希望对您有所帮助。',
  '根据您描述的情况，我建议可以从以下几个方面入手考虑。',
  '这是一个很好的问题。让我从专业角度为您分析，帮助您做出更好的决策。',
  '了解您的需求后，我为您整理了以下要点和建议，供参考。',
];

const VIEW_MODES = [
  { key: 'bySample', label: '按样例对比' },
  { key: 'list', label: '列表视图' },
];

const SAMPLE_ALL = { id: 'all', name: '全部样例' };

type CommentTargetType = 'sample' | 'result';

const ResultsPage = () => {
  const {
    experiments, currentExperimentId,
    updateRunResultRating, addRunResult, addComment,
    updateExperiment, addVersion,
    computeRecommendedVersion, markVersionAsTeamTemplate,
  } = usePromptStore();

  const currentExp = experiments.find((e) => e.id === currentExperimentId) || experiments[0];
  const [viewMode, setViewMode] = useState('bySample');
  const [selectedSampleId, setSelectedSampleId] = useState('all');
  const [isRunning, setIsRunning] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentTarget, setCommentTarget] = useState<{ type: CommentTargetType; id: string } | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const results = currentExp?.results || [];
  const allComments = currentExp?.comments || [];
  const sampleInputs = currentExp?.sampleInputs || [];
  const versions = currentExp?.versions || [];
  const latestVersion = versions[0];

  const recommended: RecommendedVersion | null = useMemo(() => {
    if (!currentExp) return null;
    return computeRecommendedVersion(currentExp.id);
  }, [currentExp, computeRecommendedVersion]);

  const teamTemplateVersion = useMemo(() => {
    return versions.find((v) => v.isTeamTemplate);
  }, [versions]);

  const sampleOptions = useMemo(() => {
    return [SAMPLE_ALL, ...sampleInputs];
  }, [sampleInputs]);

  const avgRating = useMemo(() => {
    const latestResults = latestVersion
      ? results.filter((r) => r.versionId === latestVersion.id && r.rating > 0)
      : [];
    if (latestResults.length === 0) return '0.0';
    return (latestResults.reduce((sum, r) => sum + r.rating, 0) / latestResults.length).toFixed(1);
  }, [results, latestVersion]);

  const resultsBySample = useMemo(() => {
    const grouped: Record<string, { sample: typeof sampleInputs[0] | null; results: RunResult[] }> = {};
    sampleInputs.forEach((sample) => {
      grouped[sample.id] = { sample, results: [] };
    });
    results.forEach((r) => {
      if (!grouped[r.sampleInputId]) {
        grouped[r.sampleInputId] = {
          sample: sampleInputs.find((s) => s.id === r.sampleInputId) || null,
          results: [],
        };
      }
      grouped[r.sampleInputId].results.push(r);
    });
    Object.keys(grouped).forEach((sid) => {
      grouped[sid].results.sort((a, b) => b.versionNumber - a.versionNumber);
    });
    return Object.values(grouped).filter((g) => g.results.length > 0);
  }, [results, sampleInputs]);

  const displayedSampleResults = useMemo(() => {
    if (selectedSampleId === 'all') return resultsBySample;
    return resultsBySample.filter((g) => g.sample?.id === selectedSampleId);
  }, [resultsBySample, selectedSampleId]);

  const getSampleComments = (sampleId: string) =>
    allComments.filter((c) => c.targetType === 'sample' && c.targetId === sampleId);

  const getResultComments = (resultId: string) =>
    allComments.filter((c) => c.targetType === 'result' && c.targetId === resultId);

  const getRatingDiff = (result: RunResult): string | null => {
    const sameSampleResults = results.filter(
      (r) => r.sampleInputId === result.sampleInputId && r.rating > 0
    );
    if (sameSampleResults.length < 2) return null;
    const newerResults = sameSampleResults.filter((r) => r.versionNumber > result.versionNumber);
    if (newerResults.length === 0) return null;
    const nextVersionResult = newerResults.sort((a, b) => a.versionNumber - b.versionNumber)[0];
    if (!nextVersionResult || nextVersionResult.rating === 0) return null;
    const diff = nextVersionResult.rating - result.rating;
    if (diff > 0) return `↑ +${diff}`;
    if (diff < 0) return `↓ ${diff}`;
    return '— 持平';
  };

  const handleRerun = useCallback(() => {
    if (!currentExp || currentExp.sampleInputs.length === 0) {
      Taro.showToast({ title: '请先添加示例输入', icon: 'none' });
      return;
    }

    let runVersionId = '';
    let runVersionNum = 0;

    if (currentExp.versions.length === 0) {
      const newVersion = addVersion(currentExp.id, '试跑自动生成');
      if (newVersion) {
        runVersionId = newVersion.id;
        runVersionNum = newVersion.versionNumber;
      }
    } else {
      const latest = currentExp.versions[0];
      if (currentExp.promptContent !== latest.content) {
        const newVersion = addVersion(currentExp.id, `编辑后试跑自动生成`);
        if (newVersion) {
          runVersionId = newVersion.id;
          runVersionNum = newVersion.versionNumber;
        }
      } else {
        runVersionId = latest.id;
        runVersionNum = latest.versionNumber;
      }
    }

    if (!runVersionId) {
      Taro.showToast({ title: '保存版本失败', icon: 'none' });
      return;
    }

    setIsRunning(true);

    setTimeout(() => {
      currentExp.sampleInputs.forEach((sample) => {
        const responseIdx = Math.floor(Math.random() * MOCK_RESPONSES.length);
        const result: RunResult = {
          id: generateId(),
          sampleInputId: sample.id,
          sampleName: sample.name,
          output: `[v${runVersionNum}] ${MOCK_RESPONSES[responseIdx]}\n\n基于提示词 v${runVersionNum} 生成的回复（样例：${sample.name}）`,
          rating: 0,
          createdAt: new Date().toISOString(),
          versionId: runVersionId,
          versionNumber: runVersionNum,
        };
        addRunResult(currentExp.id, result);
      });
      updateExperiment(currentExp.id, { status: 'testing' });
      setIsRunning(false);
      Taro.showToast({ title: `v${runVersionNum} 试跑完成`, icon: 'success' });
      console.info('[Results] Rerun completed for version:', runVersionNum);
    }, 1500);
  }, [currentExp, addVersion, addRunResult, updateExperiment]);

  const handleRate = (resultId: string, rating: number) => {
    if (currentExp) {
      updateRunResultRating(currentExp.id, resultId, rating);
      console.info('[Results] Rated:', resultId, rating);
    }
  };

  const handleExport = () => {
    if (!currentExp || results.length === 0) return;
    let text = '';
    text += `📋 提示词实验：${currentExp.name}\n`;
    text += `🔖 最新版本：v${latestVersion?.versionNumber || 0} - ${latestVersion?.note || '未保存'}\n`;
    text += `📊 最新版平均评分：${avgRating} / 5.0\n`;
    if (recommended) {
      text += `🏆 推荐版本：v${recommended.versionNumber}（${recommended.overallRating.toFixed(1)}分）\n`;
    }
    if (selectedSampleId !== 'all') {
      const sampleName = sampleInputs.find(s => s.id === selectedSampleId)?.name || selectedSampleId;
      text += `🔍 筛选样例：${sampleName}\n`;
    }
    text += `━━━━━━━━━━━━━\n\n`;
    text += `📝 最新提示词：\n${currentExp.promptContent}\n\n`;
    text += `━━━━━━━━━━━━━\n\n`;

    displayedSampleResults.forEach((group) => {
      text += `🧪 样例：${group.sample?.name || '未知'}\n`;
      group.results.forEach((r) => {
        text += `  🔖 v${r.versionNumber} | 评分：${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}（${r.rating}/5）\n`;
        text += `  💬 ${r.output}\n\n`;
      });
      text += `───\n`;
    });

    Taro.setClipboardData({ data: text }).then(() => {
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      console.info('[Results] Exported text copied');
    }).catch((err) => {
      console.error('[Results] Copy failed:', err);
      Taro.showToast({ title: '复制失败', icon: 'none' });
    });
  };

  const openSampleComment = (sampleId: string) => {
    setCommentTarget({ type: 'sample', id: sampleId });
    setCommentInput('');
  };

  const openResultComment = (resultId: string) => {
    setCommentTarget({ type: 'result', id: resultId });
    setCommentInput('');
    setExpandedResult(resultId);
  };

  const handleSendComment = () => {
    if (!currentExp || !commentTarget) return;
    if (!commentInput.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    const comment: Comment = {
      id: generateId(),
      author: '我',
      avatar: 'https://picsum.photos/id/1027/200/200',
      content: commentInput.trim(),
      createdAt: new Date().toISOString(),
      targetType: commentTarget.type,
      targetId: commentTarget.id,
    };

    if (commentTarget.type === 'sample') {
      const sample = sampleInputs.find((s) => s.id === commentTarget.id);
      comment.sampleName = sample?.name;
    } else {
      const result = results.find((r) => r.id === commentTarget.id);
      if (result) {
        comment.resultId = result.id;
        comment.versionNumber = result.versionNumber;
        comment.sampleName = result.sampleName;
      }
    }

    addComment(currentExp.id, comment);
    setCommentTarget(null);
    setCommentInput('');
    Taro.showToast({ title: '评论已发布', icon: 'success' });
    console.info('[Results] Comment added:', commentTarget.type, commentTarget.id);
  };

  const handleToggleTeamTemplate = (versionId: string, isTeam: boolean) => {
    if (!currentExp) return;
    markVersionAsTeamTemplate(currentExp.id, versionId, !isTeam);
    Taro.showToast({
      title: !isTeam ? '已设为团队模板' : '已取消团队模板',
      icon: 'success',
    });
  };

  const handleSampleChange = (e) => {
    const idx = e.detail.value;
    setSelectedSampleId(sampleOptions[idx]?.id || 'all');
  };

  const toggleResultExpand = (resultId: string) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
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
            <Text className={styles.overviewStatLabel}>总回答</Text>
          </View>
          <View className={styles.overviewStatItem}>
            <Text className={styles.overviewStatValue}>{avgRating}</Text>
            <Text className={styles.overviewStatLabel}>最新版评分</Text>
          </View>
          <View className={styles.overviewStatItem}>
            <Text className={styles.overviewStatValue}>v{latestVersion?.versionNumber || 0}</Text>
            <Text className={styles.overviewStatLabel}>最新版本</Text>
          </View>
        </View>
      </View>

      {recommended && (
        <View className={styles.decisionCard}>
          <View className={styles.decisionHeader}>
            <Text className={styles.decisionLabel}>🏆 推荐保留版本</Text>
            <View className={classnames(
              styles.confidenceTag,
              recommended.confidence === 'high' && styles.confidenceHigh,
              recommended.confidence === 'medium' && styles.confidenceMedium,
              recommended.confidence === 'low' && styles.confidenceLow,
            )}>
              <Text className={styles.confidenceTagText}>
                {recommended.confidence === 'high' ? '高置信' : recommended.confidence === 'medium' ? '中置信' : '低置信'}
              </Text>
            </View>
          </View>

          <View className={styles.decisionVersionRow}>
            <View className={styles.decisionVersionBadge}>
              <Text className={styles.decisionVersionBadgeText}>v{recommended.versionNumber}</Text>
            </View>
            <View className={styles.decisionRating}>
              <StarRating value={Math.round(recommended.overallRating)} size={24} readonly />
              <Text className={styles.decisionRatingText}>{recommended.overallRating.toFixed(1)} 分</Text>
            </View>
            {teamTemplateVersion?.id === recommended.versionId ? (
              <View className={styles.teamBadged}>
                <Text className={styles.teamBadgedText}>★ 团队模板</Text>
              </View>
            ) : (
              <View
                className={styles.markTeamBtn}
                onClick={() => handleToggleTeamTemplate(recommended.versionId, false)}
              >
                <Text className={styles.markTeamBtnText}>设为团队模板</Text>
              </View>
            )}
          </View>

          <Text className={styles.decisionReason}>💡 {recommended.reason}</Text>

          <View className={styles.useCaseList}>
            {recommended.useCases.map((uc, idx) => (
              <View key={idx} className={styles.useCaseItem}>
                <Text className={styles.useCaseDot}>•</Text>
                <Text className={styles.useCaseText}>{uc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.filterBar}>
        <Picker
          mode="selector"
          range={sampleOptions.map((s) => s.name)}
          onChange={handleSampleChange}
        >
          <View className={styles.filterPicker}>
            <Text className={styles.filterPickerText}>
              {sampleOptions.find(s => s.id === selectedSampleId)?.name || '全部样例'} ▾
            </Text>
          </View>
        </Picker>

        <View className={styles.viewModeTabs}>
          {VIEW_MODES.map((m) => (
            <View
              key={m.key}
              className={classnames(styles.viewModeTab, viewMode === m.key && styles.viewModeTabActive)}
              onClick={() => setViewMode(m.key)}
            >
              <Text className={classnames(styles.viewModeTabText, viewMode === m.key && styles.viewModeTabActiveText)}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {results.length === 0 ? (
        <EmptyState
          title="暂无试跑结果"
          description="在编辑器中点击「批量试跑」查看结果"
        />
      ) : viewMode === 'bySample' ? (
        <ScrollView scrollY className={styles.compareContainer} style={{ height: recommended ? 'calc(100vh - 900rpx)' : 'calc(100vh - 560rpx)' }}>
          {displayedSampleResults.map((group) => (
            <View key={group.sample?.id || 'unknown'} className={styles.sampleGroup}>
              <View className={styles.sampleGroupHeader}>
                <Text className={styles.sampleGroupName}>🧪 {group.sample?.name || '未知样例'}</Text>
                <Text
                  className={styles.sampleGroupCommentBtn}
                  onClick={() => openSampleComment(group.sample?.id || '')}
                >
                  💬 {getSampleComments(group.sample?.id || '').length}
                </Text>
              </View>

              <ScrollView scrollX className={styles.versionCompareScroll}>
                <View className={styles.versionCompareRow}>
                  {group.results.map((result) => (
                    <View key={result.id} className={styles.versionCard}>
                      <View className={styles.versionCardHeader}>
                        <View className={classnames(
                          styles.versionBadge,
                          recommended?.versionId === result.versionId && styles.versionBadgeRecommended,
                        )}>
                          <Text className={styles.versionBadgeText}>v{result.versionNumber}</Text>
                        </View>
                        {getRatingDiff(result) && (
                          <View className={classnames(
                            styles.ratingDiff,
                            getRatingDiff(result)?.startsWith('↑') && styles.ratingDiffUp,
                            getRatingDiff(result)?.startsWith('↓') && styles.ratingDiffDown,
                          )}>
                            <Text className={styles.ratingDiffText}>{getRatingDiff(result)}</Text>
                          </View>
                        )}
                      </View>
                      <Text className={styles.versionCardOutput}>{result.output}</Text>
                      <View className={styles.versionCardFooter}>
                        <StarRating
                          value={result.rating}
                          size={24}
                          onChange={(rating) => handleRate(result.id, rating)}
                          readonly={false}
                        />
                        <Text className={styles.versionCardTime}>
                          {dayjs(result.createdAt).format('MM-DD HH:mm')}
                        </Text>
                      </View>

                      <View className={styles.resultCommentRow}>
                        <Text
                          className={styles.resultCommentBtn}
                          onClick={() => toggleResultExpand(result.id)}
                        >
                          💬 回答评论 ({getResultComments(result.id).length})
                        </Text>
                      </View>

                      {expandedResult === result.id && (
                        <View className={styles.resultCommentSection}>
                          {getResultComments(result.id).length > 0 ? (
                            getResultComments(result.id).map((c) => (
                              <View key={c.id} className={styles.resultCommentItem}>
                                <Image className={styles.resultCommentAvatar} src={c.avatar} mode="aspectFill" />
                                <View className={styles.resultCommentBody}>
                                  <View className={styles.resultCommentMeta}>
                                    <Text className={styles.resultCommentAuthor}>{c.author}</Text>
                                    {c.versionNumber && (
                                      <Text className={styles.resultCommentVersion}>v{c.versionNumber}</Text>
                                    )}
                                    {c.sampleName && (
                                      <Text className={styles.resultCommentSample}>{c.sampleName}</Text>
                                    )}
                                  </View>
                                  <Text className={styles.resultCommentContent}>{c.content}</Text>
                                  <Text className={styles.resultCommentTime}>
                                    {dayjs(c.createdAt).format('MM-DD HH:mm')}
                                  </Text>
                                </View>
                              </View>
                            ))
                          ) : (
                            <Text className={styles.commentEmpty}>还没有评论</Text>
                          )}
                          <View className={styles.resultCommentInputRow}>
                            <Textarea
                              className={styles.resultCommentInput}
                              placeholder={`针对 v${result.versionNumber} 的这条回答发表评论...`}
                              value={commentTarget?.id === result.id && commentTarget?.type === 'result' ? commentInput : ''}
                              onInput={(e) => {
                                setCommentTarget({ type: 'result', id: result.id });
                                setCommentInput(e.detail.value);
                              }}
                              onFocus={() => setCommentTarget({ type: 'result', id: result.id })}
                              autoHeight
                            />
                            {commentTarget?.id === result.id && commentTarget?.type === 'result' && commentInput.trim() && (
                              <View className={styles.resultCommentSendBtn} onClick={handleSendComment}>
                                <Text className={styles.resultCommentSendText}>发送</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {getSampleComments(group.sample?.id || '').length > 0 && (
                <View className={styles.sampleComments}>
                  {getSampleComments(group.sample?.id || '').slice(0, 2).map((comment) => (
                    <View key={comment.id} className={styles.sampleCommentItem}>
                      <Image className={styles.sampleCommentAvatar} src={comment.avatar} mode="aspectFill" />
                      <View className={styles.sampleCommentBody}>
                        <Text className={styles.sampleCommentAuthor}>{comment.author}</Text>
                        <Text className={styles.sampleCommentText}>{comment.content}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView scrollY className={styles.resultsList} style={{ height: recommended ? 'calc(100vh - 900rpx)' : 'calc(100vh - 560rpx)' }}>
          {results.map((result) => (
            <View key={result.id} className={styles.resultItem}>
              <View className={styles.resultHeader}>
                <View className={classnames(
                  styles.resultVersionBadge,
                  recommended?.versionId === result.versionId && styles.resultVersionBadgeRecommended,
                )}>
                  <Text className={styles.resultVersionText}>v{result.versionNumber}</Text>
                </View>
                <Text className={styles.resultSampleName}>{result.sampleName}</Text>
              </View>
              <Text className={styles.resultOutput}>{result.output}</Text>
              <View className={styles.resultFooter}>
                <StarRating
                  value={result.rating}
                  size={24}
                  onChange={(rating) => handleRate(result.id, rating)}
                  readonly={false}
                />
                <Text className={styles.resultTime}>
                  {dayjs(result.createdAt).format('MM-DD HH:mm')}
                </Text>
                <Text
                  className={styles.resultCommentBtnList}
                  onClick={() => openResultComment(result.id)}
                >
                  💬 {getResultComments(result.id).length}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View className={styles.exportBtn} onClick={handleExport}>
        <Text className={styles.exportBtnText}>导出分享结果</Text>
      </View>

      {commentTarget?.type === 'sample' && (
        <View className={styles.commentModal} onClick={() => setCommentTarget(null)}>
          <View className={styles.commentModalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.commentModalTitle}>
              针对样例「{sampleInputs.find(s => s.id === commentTarget.id)?.name}」发表评论
            </Text>
            <Textarea
              className={styles.commentModalInput}
              placeholder="输入评论内容..."
              value={commentInput}
              onInput={(e) => setCommentInput(e.detail.value)}
              autoHeight
            />
            <View className={styles.commentModalActions}>
              <View className={styles.commentCancelBtn} onClick={() => setCommentTarget(null)}>
                <Text className={styles.commentCancelText}>取消</Text>
              </View>
              <View className={styles.commentSendBtn} onClick={handleSendComment}>
                <Text className={styles.commentSendText}>发送</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ResultsPage;
