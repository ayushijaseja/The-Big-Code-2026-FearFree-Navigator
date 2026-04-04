import { Router } from 'express';
import get_safe_route from '../controllers/get-safe-route.controller';
import handle_sos from '../controllers/handle-sos.controller';
import handle_chat from '../controllers/chat.controller';
import get_route_briefing from '../controllers/breifing.controller';

const router = Router();

router.post('/get-safe-routes', get_safe_route);

router.post('/handle-sos', handle_sos);

router.post('/chat', handle_chat);

router.post('/route-briefing', get_route_briefing);

router.get("/", (req,res)=>{
    res.send("Hello World");
    return;
})

export default router;