import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface FragmentCardProps {
  title: string;
  content: string;
  category: string;
  usageCount: number;
  isTeamTemplate: boolean;
  onClick?: () => void;
  onUse?: () => void;
}

const FragmentCard: React.FC<FragmentCardProps> = ({
  title,
  content,
  category,
  usageCount,
  isTeamTemplate,
  onClick,
  onUse,
}) => {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.cardTitle}>{title}</Text>
        {isTeamTemplate && (
          <View className={styles.teamBadge}>
            <Text className={styles.teamBadgeText}>团队模板</Text>
          </View>
        )}
      </View>
      <Text className={styles.cardContent}>{content}</Text>
      <View className={styles.cardFooter}>
        <View className={styles.categoryTag}>
          <Text className={styles.categoryTagText}>{category}</Text>
        </View>
        <View className={styles.useInfo}>
          <Text className={styles.useText}>使用 {usageCount} 次</Text>
          <View className={styles.useBtn} onClick={(e) => { e.stopPropagation(); onUse?.(); }}>
            <Text className={styles.useBtnText}>使用</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FragmentCard;
