import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string
    }
}

export async function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' })
        return
    }

    const token = authHeader.split(' ')[1]
    const {data, error} = await supabase.auth.getUser(token)

    if (error || !data.user) {
        res.status(401).json({ error: 'Invalid or expired token' })
        return
    }

    req.user = {
        id: data.user.id,
        email: data.user.email
    }
    next()
}