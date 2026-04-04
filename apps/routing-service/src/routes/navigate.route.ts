import { Router } from 'express';
import get_safe_route from '../controllers/get-safe-route.controller';
import handle_sos from '../controllers/handle-sos.controller';
import handle_chat from '../controllers/chat.controller';
import get_route_briefing from '../controllers/breifing.controller';
import handle_escort_call from '../controllers/escort.controller';
import { get_nearby_users, update_location } from '../controllers/location.controller';

const router = Router();

router.post('/get-safe-routes', get_safe_route);

router.post('/handle-sos', handle_sos);

router.post('/chat', handle_chat);

router.post('/route-briefing', get_route_briefing);

router.post('/escort-call', handle_escort_call);

router.post('/location/update', update_location);
router.post('/location/nearby', get_nearby_users);

router.get("/", (req,res)=>{
    res.send("Hello World");
    return;
})

export default router;