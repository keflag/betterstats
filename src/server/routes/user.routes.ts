/**
 * @fileName user.routes.ts
 * @description 用户 API 路由 - 包含输入验证和错误处理
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { UserDAO } from '../dao/UserDAO';
import { validateInput, idSchema, paginationSchema, stringSchema } from '../utils/validators';

const router = Router();
const userDAO = new UserDAO();

router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page, pageSize } = validateInput(paginationSchema, req.query);
    const offset = (page - 1) * pageSize;
    
    const users = await userDAO.findAll(pageSize, offset);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        pageSize,
        total: users.length,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = validateInput(idSchema, req.params);
    
    const user = await userDAO.findById(id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/users', async (req: Request, res: Response) => {
  try {
    const { name } = validateInput(stringSchema, req.body);
    
    const user = await userDAO.create(name, `${name}@example.com`);
    
    res.status(201).json({
      success: true,
      data: user,
      message: '用户创建成功',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = validateInput(idSchema, req.params);
    const { name } = validateInput(stringSchema, req.body);
    
    const user = await userDAO.update(id, name, `${name}@example.com`);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }
    
    res.json({
      success: true,
      data: user,
      message: '用户更新成功',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = validateInput(idSchema, req.params);
    
    const deleted = await userDAO.delete(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }
    
    res.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
