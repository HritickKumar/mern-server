import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    adminListUsers,
    adminChangeRole,
    adminBlockUser,
    adminUnblockUser,
    adminInvalidateUserSessions,
    adminGetUser
} from "../controllers/adminController.js";
import { joiValidate } from "../middleware/joiValidation.js";
import { adminListQuerySchema, adminChangeRoleSchema, adminBlockSchema, adminInvalidateSchema } from "../validators/joiSchemas.js"

const router = express.Router();

router.use(auth, requireRole("admin"));


router.get("/users", joiValidate({ query: adminListQuerySchema }), adminListUsers);
router.get("/users/:id", adminGetUser);
router.post("/users/role", joiValidate({ body: adminChangeRoleSchema }), adminChangeRole);
router.post("/users/block", joiValidate({ body: adminBlockSchema }), adminBlockUser);
router.post("/users/unblock", joiValidate({ body: adminBlockSchema }), adminUnblockUser);
router.post("/users/invalidate-sessions", joiValidate({ body: adminInvalidateSchema }), adminInvalidateUserSessions);

export default router;
