import { Router } from 'express';
import get_safe_route from '../controllers/get-safe-route.controller';

const router = Router();

router.post('/get-safe-routes', get_safe_route);

router.get("/", (req,res)=>{
    res.send("Hello World");
    return;
})

export default router;