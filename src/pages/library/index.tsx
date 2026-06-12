import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/store/usePromptStore';
import FragmentCard from '@/components/FragmentCard';
import EmptyState from '@/components/EmptyState';
import { generateId } from '@/utils/helpers';
import type { Fragment } from '@/types';
import styles from './index.module.scss';

const TAB_OPTIONS = [
  { key: 'mine', label: '我的收藏' },
  { key: 'team', label: '团队模板' },
];

const DEFAULT_CATEGORIES = ['全部', '角色设定', '输出格式', '约束条件', '语气风格', '分析框架', '功能模板'];

const LibraryPage = () => {
  const {
    fragments, toggleFragmentFavorite, incrementFragmentUsage,
    addFragment, updateFragmentCategory, setPendingFragment,
  } = usePromptStore();
  const [activeTab, setActiveTab] = useState('mine');
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFragTitle, setNewFragTitle] = useState('');
  const [newFragContent, setNewFragContent] = useState('');
  const [newFragCategory, setNewFragCategory] = useState('通用');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const displayFragments = useMemo(() => {
    let list = [...fragments];
    if (activeTab === 'mine') {
      list = list.filter((f) => f.isFavorite);
    }
    if (activeCategory !== '全部') {
      list = list.filter((f) => f.category === activeCategory);
    }
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter(
        (f) => f.title.toLowerCase().includes(kw) || f.content.toLowerCase().includes(kw),
      );
    }
    return list;
  }, [fragments, activeTab, searchText, activeCategory]);

  const handleToggleFavorite = (fragmentId: string) => {
    toggleFragmentFavorite(fragmentId);
    const frag = fragments.find((f) => f.id === fragmentId);
    if (frag) {
      Taro.showToast({
        title: frag.isFavorite ? '已取消收藏' : '已收藏',
        icon: 'success',
      });
      console.info('[Library] Toggle favorite:', fragmentId);
    }
  };

  const handleUseFragment = (fragment: Fragment) => {
    incrementFragmentUsage(fragment.id);
    setPendingFragment(fragment.content);
    Taro.showToast({
      title: '已插入到编辑器',
      icon: 'success',
      duration: 1200,
    });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/editor/index' });
    }, 600);
    console.info('[Library] Use fragment:', fragment.id);
  };

  const handleAddFragment = () => {
    if (!newFragTitle.trim() || !newFragContent.trim()) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    const fragment: Fragment = {
      id: generateId(),
      title: newFragTitle.trim(),
      content: newFragContent.trim(),
      category: newFragCategory,
      isFavorite: activeTab === 'mine',
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    addFragment(fragment);
    setShowAddModal(false);
    setNewFragTitle('');
    setNewFragContent('');
    Taro.showToast({ title: '片段已保存', icon: 'success' });
    console.info('[Library] Fragment added:', fragment.id);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setShowCategoryPicker(false);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>素材库</Text>
        <Text className={styles.subtitle}>常用片段快速复用</Text>
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索片段..."
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <View className={styles.tabBar}>
        {TAB_OPTIONS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={classnames(styles.tabText, activeTab === tab.key && styles.tabTextActive)}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView scrollX className={styles.categoryBar}>
        {DEFAULT_CATEGORIES.map((cat) => (
          <View
            key={cat}
            className={classnames(styles.categoryItem, activeCategory === cat && styles.categoryActive)}
            onClick={() => handleCategoryChange(cat)}
          >
            <Text className={classnames(styles.categoryText, activeCategory === cat && styles.categoryTextActive)}>
              {cat}
            </Text>
          </View>
        ))}
      </ScrollView>

      {displayFragments.length > 0 ? (
        <ScrollView scrollY className={styles.fragmentList} style={{ height: 'calc(100vh - 600rpx)' }}>
          {displayFragments.map((fragment) => (
            <FragmentCard
              key={fragment.id}
              fragment={fragment}
              onUse={() => handleUseFragment(fragment)}
              onFavorite={() => handleToggleFavorite(fragment.id)}
              showFavorite
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          title="暂无素材片段"
          description="点击右下角 + 添加常用片段"
        />
      )}

      <View className={styles.fab} onClick={() => setShowAddModal(true)}>
        <Text className={styles.fabText}>+</Text>
      </View>

      {showAddModal && (
        <View className={styles.modal} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>新增素材片段</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>标题</Text>
              <Input
                className={styles.formInput}
                placeholder="片段标题"
                value={newFragTitle}
                onInput={(e) => setNewFragTitle(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>分类</Text>
              <View className={styles.categoryOptions}>
                {DEFAULT_CATEGORIES.filter(c => c !== '全部').map((cat) => (
                  <View
                    key={cat}
                    className={classnames(
                      styles.categoryOption,
                      newFragCategory === cat && styles.categoryOptionActive,
                    )}
                    onClick={() => setNewFragCategory(cat)}
                  >
                    <Text className={classnames(
                      styles.categoryOptionText,
                      newFragCategory === cat && styles.categoryOptionTextActive,
                    )}>
                      {cat}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>内容</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="输入提示词片段内容..."
                value={newFragContent}
                onInput={(e) => setNewFragContent(e.detail.value)}
                autoHeight
              />
            </View>

            <View className={styles.modalActions}>
              <View className={styles.modalBtnCancel} onClick={() => setShowAddModal(false)}>
                <Text className={styles.modalBtnCancelText}>取消</Text>
              </View>
              <View className={styles.modalBtnConfirm} onClick={handleAddFragment}>
                <Text className={styles.modalBtnConfirmText}>保存</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default LibraryPage;
