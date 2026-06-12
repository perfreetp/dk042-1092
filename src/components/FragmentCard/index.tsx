import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { Fragment } from '@/types';
import styles from './index.module.scss';

interface FragmentCardProps {
  fragment: Fragment;
  showFavorite?: boolean;
  showMove?: boolean;
  showTeam?: boolean;
  onClick?: () => void;
  onUse?: () => void;
  onFavorite?: () => void;
  onMove?: () => void;
  onTeam?: () => void;
}

const FragmentCard: React.FC<FragmentCardProps> = ({
  fragment,
  showFavorite = false,
  showMove = false,
  showTeam = false,
  onClick,
  onUse,
  onFavorite,
  onMove,
  onTeam,
}) => {
  return (
    <View className={classnames(
      styles.card,
      fragment.isFavorite && styles.cardFavorite,
      fragment.isTeamTemplate && styles.cardTeam
    )} onClick={onClick}>
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
        {fragment.isTeamTemplate && (
          <View className={styles.teamBadge}>
            <Text className={styles.teamBadgeText}>🛡 团队模板</Text>
          </View>
        )}
      </View>
      <Text className={styles.cardContent}>{fragment.content}</Text>
      <View className={styles.cardFooter}>
        <View className={styles.categoryTag}>
          <Text className={styles.categoryTagText}>{fragment.category}</Text>
        </View>
        <View className={styles.useInfo}>
          <Text className={styles.useText}>使用 {fragment.usageCount} 次</Text>
          {showTeam && (
            <View
              className={classnames(styles.teamBtn, fragment.isTeamTemplate && styles.teamBtnActive)}
              onClick={(e) => { e.stopPropagation(); onTeam?.(); }}
            >
              <Text className={styles.teamBtnText}>
                {fragment.isTeamTemplate ? '★ 已认证' : '🛡 标记团队'}
              </Text>
            </View>
          )}
          {showMove && (
            <View
              className={styles.moveBtn}
              onClick={(e) => { e.stopPropagation(); onMove?.(); }}
            >
              <Text className={styles.moveBtnText}>移动</Text>
            </View>
          )}
          <View className={styles.useBtn} onClick={(e) => { e.stopPropagation(); onUse?.(); }}>
            <Text className={styles.useBtnText}>使用</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FragmentCard;
