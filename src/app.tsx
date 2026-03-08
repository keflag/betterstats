/**
 * @fileName app.tsx
 * @description Umi应用入口，配置全局Provider
 * @author keflag
 * @createDate 2026-03-08 11:16:31
 * @lastUpdateDate 2026-03-08 11:16:31
 * @version 2.0.0
 */

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * @componentName Root
 * @description 根组件，包裹所有Provider
 */
export function Root(props: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {props.children}
    </AuthProvider>
  );
}

export default Root;
