import { Router, type IRouter } from "express";
import healthRouter from "./health";
import manhwaRouter from "./manhwa";

const router: IRouter = Router();

router.use(healthRouter);
router.use(manhwaRouter);

export default router;
