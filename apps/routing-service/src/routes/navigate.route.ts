import { Router } from 'express';
import get_safe_route from '../controllers/get-safe-route.controller';
import handle_sos from '../controllers/handle-sos.controller';

const router = Router();

router.post('/get-safe-routes', get_safe_route);

router.post('/handle-sos', handle_sos);

router.get("/", (req,res)=>{
    res.send("Hello World");
    return;
})

export default router;