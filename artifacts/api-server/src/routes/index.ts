import { Router, type IRouter } from "express";
import healthRouter from "./health";
import manhwaRouter from "./manhwa";
import scraperRouter from "./scraper";
import translateRouter from "./translate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(manhwaRouter);
router.use(scraperRouter);
router.use(translateRouter);

export default router;
