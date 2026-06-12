import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ExperimentCardProps {
  name: string;
  description: string;
  status: 'draft' | 'testing' | 'stable';
  tags: string[];
  updatedAt: string;
  resultCount: number;
  versionCount: number;
  onClick?: () => void;
}

const statusMap = {
  draft: { label: '草稿', className: styles.statusDraft },
  testing: { label: '测试中', className: styles.statusTesting },
  stable: { label: '已稳定', className: styles.statusStable },
};

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  name,
  description,
  status,
  tags,
  updatedAt,
  resultCount,
  versionCount,
  onClick,
}) => {
  const statusInfo = statusMap[status];
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.cardTitle}>{name}</Text>
        <View className={classnames(styles.statusTag, statusInfo.className)}>
          <Text className={styles.statusText}>{statusInfo.label}</Text>
        </View>
      </View>
      <Text className={styles.cardDesc}>{description}</Text>
      <View className={styles.cardTags}>
        {tags.map((tag) => (
          <View key={tag} className={styles.tag}>
            <Text className={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View className={styles.cardFooter}>
        <View className={styles.stats}>
          <Text className={styles.statText}>{versionCount} 个版本</Text>
          <Text className={styles.statDot}>·</Text>
          <Text className={styles.statText}>{resultCount} 条结果</Text>
        </View>
        <Text className={styles.timeText}>{updatedAt}</Text>
      </View>
    </View>
  );
};

export default ExperimentCard;
