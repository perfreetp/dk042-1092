import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Textarea, Picker } from '@tarojs/components';
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

const LibraryPage = () => {
  const {
    fragments, categories,
    toggleFragmentFavorite, incrementFragmentUsage,
    addFragment, updateFragmentCategory, setPendingFragment,
    addCategory, renameCategory, deleteCategory, moveFragmentToCategory,
  } = usePromptStore();

  const [activeTab, setActiveTab] = useState('mine');
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingFragment, setMovingFragment] = useState<Fragment | null>(null);
  const [newFragTitle, setNewFragTitle] = useState('');
  const [newFragContent, setNewFragContent] = useState('');
  const [newFragCategory, setNewFragCategory] = useState(categories[0] || '其他');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const displayCategories = useMemo(() => {
    return ['全部', ...categories];
  }, [categories]);

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

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Taro.showToast({ title: '请输入分类名', icon: 'none' });
      return;
    }
    if (categories.includes(newCategoryName.trim())) {
      Taro.showToast({ title: '分类已存在', icon: 'none' });
      return;
    }
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowNewCategoryInput(false);
    Taro.showToast({ title: '分类已添加', icon: 'success' });
    console.info('[Library] Category added:', newCategoryName.trim());
  };

  const handleRenameCategory = () => {
    if (!editingCategory || !editingCategoryName.trim()) {
      Taro.showToast({ title: '请输入新分类名', icon: 'none' });
      return;
    }
    if (categories.includes(editingCategoryName.trim())) {
      Taro.showToast({ title: '分类名已存在', icon: 'none' });
      return;
    }
    renameCategory(editingCategory, editingCategoryName.trim());
    setEditingCategory(null);
    setEditingCategoryName('');
    Taro.showToast({ title: '已重命名', icon: 'success' });
    console.info('[Library] Category renamed:', editingCategory, '→', editingCategoryName.trim());
  };

  const handleDeleteCategory = (category: string) => {
    Taro.showModal({
      title: '删除分类',
      content: `确定删除「${category}」分类吗？\n该分类下的片段将移至「其他」。`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          deleteCategory(category);
          if (activeCategory === category) {
            setActiveCategory('全部');
          }
          Taro.showToast({ title: '已删除', icon: 'success' });
          console.info('[Library] Category deleted:', category);
        }
      },
    });
  };

  const openMoveModal = (fragment: Fragment) => {
    setMovingFragment(fragment);
    setShowMoveModal(true);
  };

  const handleMoveFragment = (targetCategory: string) => {
    if (!movingFragment) return;
    moveFragmentToCategory(movingFragment.id, targetCategory);
    setShowMoveModal(false);
    setMovingFragment(null);
    Taro.showToast({ title: '已移动', icon: 'success' });
    console.info('[Library] Fragment moved:', movingFragment.id, '→', targetCategory);
  };

  const startEditCategory = (cat: string) => {
    setEditingCategory(cat);
    setEditingCategoryName(cat);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryName('');
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <Text className={styles.title}>素材库</Text>
          <Text className={styles.subtitle}>常用片段快速复用</Text>
        </View>
        <View className={styles.manageBtn} onClick={() => setShowCategoryModal(true)}>
          <Text className={styles.manageBtnText}>⚙ 管理</Text>
        </View>
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
        {displayCategories.map((cat) => (
          <View
            key={cat}
            className={classnames(styles.categoryItem, activeCategory === cat && styles.categoryActive)}
            onClick={() => setActiveCategory(cat)}
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
              onMove={() => openMoveModal(fragment)}
              showFavorite
              showMove
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
              <ScrollView scrollX className={styles.categoryOptions}>
                {categories.map((cat) => (
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
              </ScrollView>
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

      {showCategoryModal && (
        <View className={styles.modal} onClick={() => setShowCategoryModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>分类管理</Text>

            <ScrollView scrollY style={{ maxHeight: '50vh' }}>
              {categories.map((cat) => (
                <View key={cat} className={styles.categoryManageItem}>
                  {editingCategory === cat ? (
                    <View className={styles.categoryEditRow}>
                      <Input
                        className={styles.categoryEditInput}
                        value={editingCategoryName}
                        onInput={(e) => setEditingCategoryName(e.detail.value)}
                        autoFocus
                      />
                      <View className={styles.categoryEditBtn} onClick={handleRenameCategory}>
                        <Text className={styles.categoryEditBtnText}>✓</Text>
                      </View>
                      <View className={styles.categoryEditBtnSecondary} onClick={cancelEditCategory}>
                        <Text className={styles.categoryEditBtnSecondaryText}>✕</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text className={styles.categoryManageName}>{cat}</Text>
                      <View className={styles.categoryManageActions}>
                        <Text
                          className={styles.categoryActionText}
                          onClick={() => startEditCategory(cat)}
                        >
                          ✏️ 重命名
                        </Text>
                        <Text
                          className={styles.categoryActionTextDanger}
                          onClick={() => handleDeleteCategory(cat)}
                        >
                          🗑 删除
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              ))}

              {showNewCategoryInput ? (
                <View className={styles.categoryEditRow}>
                  <Input
                    className={styles.categoryEditInput}
                    placeholder="输入新分类名"
                    value={newCategoryName}
                    onInput={(e) => setNewCategoryName(e.detail.value)}
                    autoFocus
                  />
                  <View className={styles.categoryEditBtn} onClick={handleAddCategory}>
                    <Text className={styles.categoryEditBtnText}>✓</Text>
                  </View>
                  <View className={styles.categoryEditBtnSecondary} onClick={() => {
                    setShowNewCategoryInput(false);
                    setNewCategoryName('');
                  }}>
                    <Text className={styles.categoryEditBtnSecondaryText}>✕</Text>
                  </View>
                </View>
              ) : (
                <View className={styles.addCategoryBtn} onClick={() => setShowNewCategoryInput(true)}>
                  <Text className={styles.addCategoryBtnText}>+ 新建分类</Text>
                </View>
              )}
            </ScrollView>

            <View className={styles.modalActions}>
              <View className={styles.modalBtnConfirm} onClick={() => setShowCategoryModal(false)}>
                <Text className={styles.modalBtnConfirmText}>完成</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {showMoveModal && movingFragment && (
        <View className={styles.modal} onClick={() => setShowMoveModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>移动到分类</Text>
            <Text className={styles.modalSubtitle}>
              当前分类：{movingFragment.category}
            </Text>

            <ScrollView scrollY style={{ maxHeight: '40vh' }}>
              {categories.map((cat) => (
                <View
                  key={cat}
                  className={classnames(
                    styles.moveCategoryItem,
                    movingFragment.category === cat && styles.moveCategoryItemActive,
                  )}
                  onClick={() => handleMoveFragment(cat)}
                >
                  <Text className={styles.moveCategoryText}>{cat}</Text>
                  {movingFragment.category === cat && (
                    <Text className={styles.moveCategoryCheck}>✓</Text>
                  )}
                </View>
              ))}
            </ScrollView>

            <View className={styles.modalActions}>
              <View className={styles.modalBtnCancel} onClick={() => setShowMoveModal(false)}>
                <Text className={styles.modalBtnCancelText}>取消</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default LibraryPage;
