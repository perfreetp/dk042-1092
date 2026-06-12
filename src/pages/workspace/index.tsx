import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { usePromptStore } from '@/store/usePromptStore';
import ExperimentCard from '@/components/ExperimentCard';
import EmptyState from '@/components/EmptyState';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'testing', label: '测试中' },
  { key: 'stable', label: '已稳定' },
];

const WorkspacePage = () => {
  const { experiments, setCurrentExperiment } = usePromptStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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

      <View className={styles.fabBtn}>
        <Text className={styles.fabText}>+</Text>
      </View>
    </View>
  );
};

export default WorkspacePage;
