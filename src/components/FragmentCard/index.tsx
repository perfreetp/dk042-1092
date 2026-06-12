import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { Fragment } from '@/types';
import styles from './index.module.scss';

interface FragmentCardProps {
  fragment: Fragment;
  showFavorite?: boolean;
  onClick?: () => void;
  onUse?: () => void;
  onFavorite?: () => void;
}

const FragmentCard: React.FC<FragmentCardProps> = ({
  fragment,
  showFavorite = false,
  onClick,
  onUse,
  onFavorite,
}) => {
  return (
    <View className={classnames(styles.card, fragment.isFavorite && styles.cardFavorite)} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.titleRow}>
          <Text className={styles.cardTitle}>{fragment.title}</Text>
          {showFavorite && (
            <View
              className={classnames(styles.favIcon, fragment.isFavorite && styles.favIconActive)}
              onClick={(e) => { e.stopPropagation(); onFavorite?.(); }}
            >
              <Text className={styles.favIconText}>{fragment.isFavorite ? '★' : '☆'}</Text>
            </View>
          )}
        </View>
      </View>
      <Text className={styles.cardContent}>{fragment.content}</Text>
      <View className={styles.cardFooter}>
        <View className={styles.categoryTag}>
          <Text className={styles.categoryTagText}>{fragment.category}</Text>
        </View>
        <View className={styles.useInfo}>
          <Text className={styles.useText}>使用 {fragment.usageCount} 次</Text>
          <View className={styles.useBtn} onClick={(e) => { e.stopPropagation(); onUse?.(); }}>
            <Text className={styles.useBtnText}>使用</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FragmentCard;
