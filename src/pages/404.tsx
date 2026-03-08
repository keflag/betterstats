/**
 * @fileName 404.tsx
 * @description 404页面
 * @author keflag
 * @createDate 2026-03-08 11:16:31
 * @lastUpdateDate 2026-03-08 11:16:31
 * @version 1.0.0
 */

import React from 'react';
import { Result, Button } from 'antd';
import { history } from 'umi';

/**
 * @componentName NotFoundPage
 * @description 404页面组件
 */
const NotFoundPage: React.FC = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在"
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          返回首页
        </Button>
      }
    />
  );
};

export default NotFoundPage;
