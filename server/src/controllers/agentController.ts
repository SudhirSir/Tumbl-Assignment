import { Request, Response, NextFunction } from 'express';
import { AgentService, ChatMessage } from '../agent/agentService.js';

export async function chatWithAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        error: {
          code: 'INVALID_MESSAGES',
          message: 'Request body must contain an array of messages',
        },
      });
      return;
    }

    const response = await AgentService.processChat(messages as ChatMessage[]);

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
}
