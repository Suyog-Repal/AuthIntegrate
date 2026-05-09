import { db } from "../config/database";
import { userProfiles, users } from "../shared_schema";
import { eq } from "drizzle-orm";

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

  async updateProfile(userId: number, data: any) {
    return await db.update(userProfiles)
      .set(data)
      .where(eq(userProfiles.userId, userId))
      .returning();
  }

  async deleteUser(id: number) {
    return await db.delete(users).where(eq(users.id, id));
  }
}

export const userService = new UserService();
