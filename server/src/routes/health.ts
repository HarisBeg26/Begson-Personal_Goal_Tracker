import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
    try {
        const {error} = await supabaseAdmin.from('profiles').select('id').limit(1)

        if (error) throw error
        
        res.json({
            status: 'ok',
            supabase: 'connected',
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        res.status(500).json({
            status: 'error',
            supabase: 'disconnected',
            message: err instanceof Error ? err.message: 'Unknown error',
        })
    }
});