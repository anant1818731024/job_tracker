import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import adminPanelRouter from "./admin-panel";
import applicationsRouter from "./applications";
import remindersRouter from "./reminders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(adminPanelRouter);
router.use(applicationsRouter);
router.use(remindersRouter);

export default router;
