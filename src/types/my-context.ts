import { BaseContext } from '@apollo/server';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';

export type MyContext = BaseContext & {
    req: Request;
    res: Response;
    redis: Redis;
};
