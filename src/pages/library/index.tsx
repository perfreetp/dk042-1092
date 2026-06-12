import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/store/usePromptStore';
import FragmentCard from '@/components/FragmentCard';
import EmptyState from '@/components/EmptyState';
import { generateId } from '@/utils/helpers';
import type { Fragment } from '@/types';
import styles from './index.module.scss';

const MAIN_TABS = [
  { key: 'fragments', label: '常用片段' },
  { key: 'templates', label: '团队模板' },
];

const LibraryPage = () => {
  const {
    fragments, incrementFragmentUsage, addFragment,
    setPendingFragment,
  } = usePromptStore();
  const [activeTab, setActiveTab] = useState('fragments');
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('');

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
    const frag = fragments.find((f) => f.id === id);
    if (!frag) return;
    incrementFragmentUsage(id);
    setPendingFragment(frag.content);
    Taro.showToast({ title: '已插入编辑器', icon: 'success' });
    console.info('[Library] Fragment used and inserted:', id);
  };

  const handleAddFragment = () => {
    if (!newTitle.trim()) {
      Taro.showToast({ title: '请输入片段名称', icon: 'none' });
      return;
    }
    if (!newContent.trim()) {
      Taro.showToast({ title: '请输入片段内容', icon: 'none' });
      return;
    }
    const frag: Fragment = {
      id: generateId(),
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory.trim() || '自定义',
      isTeamTemplate: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    addFragment(frag);
    setShowAddModal(false);
    setNewTitle('');
    setNewContent('');
    setNewCategory('');
    Taro.showToast({ title: '片段已添加', icon: 'success' });
    console.info('[Library] Fragment added:', frag.id);
  };

  const handleExportText = () => {
    if (filteredFragments.length === 0) {
      Taro.showToast({ title: '暂无片段可导出', icon: 'none' });
      return;
    }
    let text = '📦 提示词片段合集\n━━━━━━━━━━━━━\n\n';
    filteredFragments.forEach((f, i) => {
      text += `${i + 1}. 【${f.title}】(${f.category})\n${f.content}\n\n`;
    });
    Taro.setClipboardData({ data: text }).then(() => {
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
    }).catch((err) => {
      console.error('[Library] Export failed:', err);
      Taro.showToast({ title: '复制失败', icon: 'none' });
    });
  };

  const handleShareLink = () => {
    if (filteredFragments.length === 0) {
      Taro.showToast({ title: '暂无片段可分享', icon: 'none' });
      return;
    }
    const shareText = `提示词片段分享（${filteredFragments.length}个片段）\n\n${filteredFragments.slice(0, 3).map((f) => `• ${f.title}：${f.content.substring(0, 50)}...`).join('\n')}${filteredFragments.length > 3 ? '\n...' : ''}`;
    Taro.setClipboardData({ data: shareText }).then(() => {
      Taro.showToast({ title: '分享内容已复制', icon: 'success' });
    }).catch((err) => {
      console.error('[Library] Share failed:', err);
      Taro.showToast({ title: '复制失败', icon: 'none' });
    });
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

      <ScrollView scrollY className={styles.fragmentList} style={{ height: 'calc(100vh - 580rpx)' }}>
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
          <View className={styles.exportBtn} onClick={handleExportText}>
            <Text className={styles.exportBtnText}>导出文本</Text>
          </View>
          <View className={styles.exportBtn} onClick={handleShareLink}>
            <Text className={styles.exportBtnText}>分享链接</Text>
          </View>
        </View>
      </View>

      <View className={styles.addBtn} onClick={() => setShowAddModal(true)}>
        <Text className={styles.addText}>+</Text>
      </View>

      {showAddModal && (
        <View className={styles.modal} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>新增片段</Text>
              <Text className={styles.modalClose} onClick={() => setShowAddModal(false)}>✕</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>片段名称</Text>
              <Input
                className={styles.formInput}
                placeholder="例如：语气风格-亲切"
                value={newTitle}
                onInput={(e) => setNewTitle(e.detail.value)}
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>分类</Text>
              <Input
                className={styles.formInput}
                placeholder="例如：语气风格"
                value={newCategory}
                onInput={(e) => setNewCategory(e.detail.value)}
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>片段内容</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="输入提示词片段内容..."
                value={newContent}
                onInput={(e) => setNewContent(e.detail.value)}
                maxlength={-1}
                autoHeight
              />
            </View>
            <View className={styles.confirmBtn} onClick={handleAddFragment}>
              <Text className={styles.confirmBtnText}>确认添加</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default LibraryPage;
