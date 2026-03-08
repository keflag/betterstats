/**
 * @fileName 403.tsx
 * @description 403无权限页面
 * @author keflag
 * @createDate 2026-03-08 11:16:31
 * @lastUpdateDate 2026-03-08 11:16:31
 * @version 1.0.0
 */

import React from 'react';
import { Result, Button } from 'antd';
import { history } from 'umi';

/**
 * @componentName ForbiddenPage
 * @description 403无权限页面组件
 */
const ForbiddenPage: React.FC = () => {
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问此页面"
      extra={
        <Button type="primary" onClick={() => history.push('/home')}>
          返回首页
        </Button>
      }
    />
  );
};

export default ForbiddenPage;
