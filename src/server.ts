import app from "./app";
import { prisma } from "./lib/prisma";
import { seedSuperAdmin } from "./utils/seed";

const PORT = process.env.PORT || 3000;

async function main() {
    try {
         await prisma.$connect();
         await seedSuperAdmin();
        console.log("Connected to the database successfully.");

        app.listen(PORT, () => {
            console.log(`Server is running on ${PORT}`);
        });
    } catch (error) {
        console.error("An error occurred:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();