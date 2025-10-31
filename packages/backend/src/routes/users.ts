import { Router, Request, Response } from "express";
import { prisma } from "../config/database";
import { requireAuth, getUserId } from "../middleware/auth";
import { auth } from "../utils/auth";

const router: Router = Router();

/**
 * GET /api/users/profile
 * Get current user's profile (protected)
 */
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    console.log(await auth.api,"api")
    if (!userId) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      error: "Failed to fetch user profile",
    });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile (protected)
 */
router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, image } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(image && { image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      error: "Failed to update user profile",
    });
  }
});

/**
 * GET /api/users
 * Get all users (admin only - protected)
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (protected)
 */
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
});

export default router;
