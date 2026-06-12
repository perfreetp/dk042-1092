import React from 'react';
import { View, Text } from '@tarojs/components';
import StarRating from '@/components/StarRating';
import type { RunResult } from '@/types';
import styles from './index.module.scss';

interface ResultCardProps {
  result: RunResult;
  onRate?: (rating: number) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onRate }) => {
  return (
    <View className={styles.card}>
      <View className={styles.cardHeader}>
        <View className={styles.sampleTag}>
          <Text className={styles.sampleTagText}>{result.sampleName}</Text>
        </View>
        <StarRating value={result.rating} size={28} editable={!!onRate} onChange={onRate} />
      </View>
      <Text className={styles.outputText}>{result.output}</Text>
      <View className={styles.cardFooter}>
        <Text className={styles.timeText}>{result.createdAt}</Text>
      </View>
    </View>
  );
};

export default ResultCard;
