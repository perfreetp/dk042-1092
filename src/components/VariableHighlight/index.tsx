import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface VariableHighlightProps {
  text: string;
}

const VariableHighlight: React.FC<VariableHighlightProps> = ({ text }) => {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <View className={styles.container}>
      {parts.map((part, index) => {
        const isVariable = /^\{\{\w+\}\}$/.test(part);
        if (isVariable) {
          const varName = part.replace(/^\{\{|\}\}$/g, '');
          return (
            <View key={index} className={styles.variable}>
              <Text className={styles.variableText}>{varName}</Text>
            </View>
          );
        }
        return <Text key={index} className={styles.normalText}>{part}</Text>;
      })}
    </View>
  );
};

export default VariableHighlight;
