import { db } from "../db/index.js";
import { userProfiles, users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface UpdateProfileData {
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
}

export class UserService {
  async getAllUsers() {
    return await db.query.users.findMany({
      with: {
        profile: true,
      },
    });
  }

  async getUserById(id: number) {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        profile: true,
      },
    });
  }

  async updateProfile(userId: number, data: UpdateProfileData) {
    return await db.update(userProfiles)
      .set(data as any)
      .where(eq(userProfiles.userId, userId))
      .returning();
  }

  async deleteUser(id: number) {
    return await db.delete(users).where(eq(users.id, id));
  }
}

export const userService = new UserService();
