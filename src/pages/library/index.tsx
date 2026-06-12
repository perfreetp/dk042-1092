import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { usePromptStore } from '@/store/usePromptStore';
import FragmentCard from '@/components/FragmentCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const MAIN_TABS = [
  { key: 'fragments', label: '常用片段' },
  { key: 'templates', label: '团队模板' },
];

const LibraryPage = () => {
  const { fragments, incrementFragmentUsage } = usePromptStore();
  const [activeTab, setActiveTab] = useState('fragments');
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const categories = useMemo(() => {
    const cats = new Set(fragments.map((f) => f.category));
    return ['全部', ...Array.from(cats)];
  }, [fragments]);

  const filteredFragments = useMemo(() => {
    let result = fragments;
    if (activeTab === 'templates') {
      result = result.filter((f) => f.isTeamTemplate);
    }
    if (activeCategory !== '全部') {
      result = result.filter((f) => f.category === activeCategory);
    }
    if (searchText) {
      result = result.filter(
        (f) => f.title.includes(searchText) || f.content.includes(searchText) || f.category.includes(searchText)
      );
    }
    return result;
  }, [fragments, activeTab, activeCategory, searchText]);

  const handleUseFragment = (id: string) => {
    incrementFragmentUsage(id);
    console.info('[Library] Fragment used:', id);
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        {MAIN_TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={classnames(styles.tabText, activeTab === tab.key && styles.tabActiveText)}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索片段名称或内容"
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView scrollX className={styles.categoryScroll}>
        {categories.map((cat) => (
          <View
            key={cat}
            className={classnames(styles.categoryItem, activeCategory === cat && styles.categoryItemActive)}
            onClick={() => setActiveCategory(cat)}
          >
            <Text className={classnames(styles.categoryText, activeCategory === cat && styles.categoryTextActive)}>
              {cat}
            </Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.fragmentList} style={{ height: 'calc(100vh - 480rpx)' }}>
        {filteredFragments.length > 0 ? (
          filteredFragments.map((frag) => (
            <FragmentCard
              key={frag.id}
              title={frag.title}
              content={frag.content}
              category={frag.category}
              usageCount={frag.usageCount}
              isTeamTemplate={frag.isTeamTemplate}
              onUse={() => handleUseFragment(frag.id)}
            />
          ))
        ) : (
          <EmptyState
            title="暂无片段"
            description="收藏常用提示词片段，编辑时快速插入"
          />
        )}
      </ScrollView>

      <View className={styles.exportSection}>
        <Text className={styles.exportTitle}>导出分享</Text>
        <View className={styles.exportActions}>
          <View className={styles.exportBtn}>
            <Text className={styles.exportBtnText}>导出文本</Text>
          </View>
          <View className={styles.exportBtn}>
            <Text className={styles.exportBtnText}>分享链接</Text>
          </View>
        </View>
      </View>

      <View className={styles.addBtn}>
        <Text className={styles.addText}>+</Text>
      </View>
    </View>
  );
};

export default LibraryPage;
