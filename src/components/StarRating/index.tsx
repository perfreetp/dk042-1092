import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  editable?: boolean;
  onChange?: (value: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  max = 5,
  size = 32,
  editable = false,
  onChange,
}) => {
  return (
    <View className={styles.container}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <View
            key={i}
            className={classnames(styles.star, filled && styles.starFilled, editable && styles.starEditable)}
            style={{ width: `${size}rpx`, height: `${size}rpx`, fontSize: `${size}rpx`, lineHeight: `${size}rpx` }}
            onClick={() => editable && onChange?.(i + 1)}
          >
            <Text style={{ fontSize: `${size}rpx` }}>{filled ? '★' : '☆'}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default StarRating;
