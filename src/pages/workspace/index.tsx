import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/store/usePromptStore';
import ExperimentCard from '@/components/ExperimentCard';
import EmptyState from '@/components/EmptyState';
import { generateId, extractVariables } from '@/utils/helpers';
import type { Variable } from '@/types';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'testing', label: '测试中' },
  { key: 'stable', label: '已稳定' },
];

const WorkspacePage = () => {
  const { experiments, setCurrentExperiment, addExperiment } = usePromptStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const filteredExperiments = useMemo(() => {
    return experiments.filter((exp) => {
      const matchSearch = !searchText || exp.name.includes(searchText) || exp.description.includes(searchText) || exp.tags.some((t) => t.includes(searchText));
      const matchStatus = activeFilter === 'all' || exp.status === activeFilter;
      return matchSearch && matchStatus;
    });
  }, [experiments, searchText, activeFilter]);

  const stats = useMemo(() => ({
    total: experiments.length,
    testing: experiments.filter((e) => e.status === 'testing').length,
    stable: experiments.filter((e) => e.status === 'stable').length,
  }), [experiments]);

  const handleExperimentClick = (id: string) => {
    setCurrentExperiment(id);
    console.info('[Workspace] Selected experiment:', id);
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      Taro.showToast({ title: '请输入实验名称', icon: 'none' });
      return;
    }
    const vars = extractVariables(newPrompt);
    const variables: Variable[] = vars.map((v) => ({ name: v, defaultValue: '' }));
    const now = new Date().toISOString();
    const newExp = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim(),
      promptContent: newPrompt,
      variables,
      sampleInputs: [],
      results: [],
      versions: [],
      comments: [],
      status: 'draft' as const,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    addExperiment(newExp);
    setCurrentExperiment(newExp.id);
    setShowCreateModal(false);
    setNewName('');
    setNewDesc('');
    setNewPrompt('');
    Taro.showToast({ title: '创建成功', icon: 'success' });
    console.info('[Workspace] Created experiment:', newExp.id);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索实验名称、描述或标签"
            placeholderClass={styles.searchInput}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
        <View className={styles.headerStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>全部实验</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.testing}</Text>
            <Text className={styles.statLabel}>测试中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.stable}</Text>
            <Text className={styles.statLabel}>已稳定</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {STATUS_FILTERS.map((filter) => (
          <View
            key={filter.key}
            className={classnames(styles.filterTag, activeFilter === filter.key && styles.filterTagActive)}
            onClick={() => setActiveFilter(filter.key)}
          >
            <Text className={classnames(styles.filterTagText, activeFilter === filter.key && styles.filterTagActiveText)}>
              {filter.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className={styles.listContainer} style={{ height: 'calc(100vh - 380rpx)' }}>
        {filteredExperiments.length > 0 ? (
          filteredExperiments.map((exp) => (
            <ExperimentCard
              key={exp.id}
              name={exp.name}
              description={exp.description}
              status={exp.status}
              tags={exp.tags}
              updatedAt={dayjs(exp.updatedAt).format('MM-DD HH:mm')}
              resultCount={exp.results.length}
              versionCount={exp.versions.length}
              onClick={() => handleExperimentClick(exp.id)}
            />
          ))
        ) : (
          <EmptyState
            title="暂无实验"
            description="点击右下角按钮创建你的第一个提示词实验"
          />
        )}
      </ScrollView>

      <View className={styles.fabBtn} onClick={() => setShowCreateModal(true)}>
        <Text className={styles.fabText}>+</Text>
      </View>

      {showCreateModal && (
        <View className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>新建实验</Text>
              <Text className={styles.modalClose} onClick={() => setShowCreateModal(false)}>✕</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>实验名称</Text>
              <Input
                className={styles.formInput}
                placeholder="例如：客服话术生成"
                value={newName}
                onInput={(e) => setNewName(e.detail.value)}
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>实验描述</Text>
              <Input
                className={styles.formInput}
                placeholder="简述实验目的"
                value={newDesc}
                onInput={(e) => setNewDesc(e.detail.value)}
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>初始提示词</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="输入提示词，使用 {{变量名}} 标记变量占位..."
                value={newPrompt}
                onInput={(e) => setNewPrompt(e.detail.value)}
                maxlength={-1}
                autoHeight
              />
            </View>
            <View className={styles.createBtn} onClick={handleCreate}>
              <Text className={styles.createBtnText}>创建实验</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default WorkspacePage;
