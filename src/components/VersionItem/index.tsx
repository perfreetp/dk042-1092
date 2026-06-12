import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import StarRating from '@/components/StarRating';
import type { PromptVersion } from '@/types';
import styles from './index.module.scss';

interface VersionItemProps {
  version: PromptVersion;
  isCurrent?: boolean;
  isLatest?: boolean;
  onClick?: () => void;
  onRollback?: () => void;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  isCurrent = false,
  isLatest = false,
  onClick,
  onRollback,
}) => {
  return (
    <View className={classnames(styles.item, isCurrent && styles.itemCurrent)} onClick={onClick}>
      <View className={styles.timeline}>
        <View className={classnames(styles.dot, isLatest && styles.dotLatest)} />
        <View className={styles.line} />
      </View>
      <View className={styles.content}>
        <View className={styles.contentHeader}>
          <View className={styles.versionInfo}>
            <Text className={styles.versionNote}>{version.note || '未命名版本'}</Text>
            {isCurrent && (
              <View className={styles.currentBadge}>
                <Text className={styles.currentBadgeText}>当前</Text>
              </View>
            )}
          </View>
          <StarRating value={Math.round(version.avgRating)} size={22} />
        </View>
        <Text className={styles.versionContent}>{version.content.substring(0, 80)}...</Text>
        <View className={styles.metaRow}>
          <Text className={styles.metaText}>{version.variables.length} 个变量</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.metaText}>{version.runCount} 次试跑</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.metaText}>{version.createdAt}</Text>
        </View>
        {!isLatest && onRollback && (
          <View className={styles.rollbackBtn} onClick={(e) => { e.stopPropagation(); onRollback(); }}>
            <Text className={styles.rollbackBtnText}>回退到此版本</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default VersionItem;
