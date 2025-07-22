import { storage } from "./storage";

async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Create sample users
    const user1 = await storage.createUser({
      username: "OLD_SINNER_",
      password: "temp123",
      role: "owner",
      cubeBalance: 999999,
    });

    const user2 = await storage.createUser({
      username: "demo_user",
      password: "temp123", 
      role: "regular",
      cubeBalance: 100,
    });

    console.log("Users created:", user1.username, user2.username);

    // Create sample room
    const room = await storage.createRoom({
      highriseRoomId: "6568702a4edd2c9dcfce647e",
      name: "Main Music Room",
      ownerId: user1.id,
      isActive: true,
      settings: {
        autoStart: true,
        maxQueueSize: 50,
        songCost: 10,
        enableCompetitions: true,
        platformPreference: "all"
      }
    });

    console.log("Room created:", room.name);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

if (import.meta.main) {
  seedDatabase();
}

export { seedDatabase };