import type { SensitiveWord } from '@/types';

const sensitiveWords: SensitiveWord[] = [
  { word: '密码', level: 'high' },
  { word: '身份证', level: 'high' },
  { word: '银行卡', level: 'high' },
  { word: '手机号', level: 'medium' },
  { word: '地址', level: 'medium' },
  { word: '姓名', level: 'low' },
  { word: '邮箱', level: 'medium' },
  { word: '验证码', level: 'high' },
  { word: '支付', level: 'medium' },
  { word: '转账', level: 'high' },
];

export function detectSensitiveWords(text: string): SensitiveWord[] {
  const found: SensitiveWord[] = [];
  for (const sw of sensitiveWords) {
    if (text.includes(sw.word)) {
      found.push(sw);
    }
  }
  return found;
}

export function extractVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (!vars.includes(match[1])) {
      vars.push(match[1]);
    }
  }
  return vars;
}

export function fillVariables(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
  }
  return result;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
