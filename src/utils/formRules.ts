/**
 * 通用 SuperForm 校验规则
 */
import { $t } from '@/locales';

export const commonRules = {
  /**
   * 必填校验
   */
  required: (message = $t('validation.required')) => ({
    required: true,
    message,
  }),

  /**
   * 邮箱校验
   */
  email: (message = $t('validation.email')) => ({
    validator: (_rule: unknown, value: unknown) => {
      if (!value) return Promise.resolve();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(String(value))) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(message));
    },
  }),

  /**
   * 中国大陆手机号校验
   */
  phone: (message = $t('validation.phone')) => ({
    validator: (_rule: unknown, value: unknown) => {
      if (!value) return Promise.resolve();
      if (/^1[3-9]\d{9}$/.test(String(value))) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(message));
    },
  }),

  /**
   * 身份证格式校验
   */
  idCard: (message = $t('validation.idCard')) => ({
    pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
    message,
  }),

  /**
   * URL 格式校验
   */
  url: (message = $t('validation.url')) => ({
    pattern: /^https?:\/\/[^\s]+$/,
    message,
  }),

  /**
   * 长度范围校验
   */
  length: (min: number, max: number, message?: string) => ({
    min,
    max,
    message: message || $t('validation.lengthRange', { min, max }),
  }),

  /**
   * 数字范围校验
   */
  range: (min: number, max: number, message?: string) => ({
    type: 'number' as const,
    min,
    max,
    message: message || $t('validation.numberRange', { min, max }),
  }),

  /**
   * 正则校验
   */
  pattern: (pattern: RegExp, message: string) => ({
    pattern,
    message,
  }),

  /**
   * 自定义校验
   */
  validator: (validatorFn: (rule: unknown, value: unknown) => Promise<void>) => ({
    validator: validatorFn,
  }),

  /**
   * 用户名格式校验
   */
  username: (message = $t('validation.usernamePattern')) => ({
    validator: (_rule: unknown, value: unknown) => {
      if (!value) return Promise.resolve();
      if (/^[a-zA-Z0-9_]+$/.test(String(value))) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(message));
    },
  }),

  /**
   * 密码强度校验
   */
  password: (message = $t('validation.passwordPattern')) => ({
    validator: (_rule: unknown, value: unknown) => {
      if (!value) return Promise.resolve();
      if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(String(value))) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(message));
    },
  }),

  /**
   * 确认密码使用 SuperForm 上下文读取原密码
   */
  confirmPassword: (field = 'password', message = $t('validation.confirmPassword')) => ({
    validator: ({ formData }: { formData?: Record<string, unknown> }, value: unknown) => {
      return !value || formData?.[field] === value
        ? Promise.resolve()
        : Promise.reject(new Error(message));
    },
  }),
};

/**
 * 创建带表单上下文的自定义校验规则
 */
export function createRule(
  validator: (value: unknown, formValues: unknown) => boolean | Promise<boolean>,
  message: string,
) {
  return {
    validator: async (context: { formData?: Record<string, unknown> }, value: unknown) => {
      const result = await validator(value, context.formData ?? {});
      if (result) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(message));
    },
  };
}
