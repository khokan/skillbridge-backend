import { Role } from "../../generated/prisma/enums";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in env");
}

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await prisma.user.findFirst({
            where:{
                role : Role.ADMIN
            }
        })

        if(isSuperAdminExist) {
            console.log("Super admin already exists. Skipping seeding super admin.");
            return;
        }

        const superAdminUser = await auth.api.signUpEmail({
            body:{
                email : email,
                password : password,
                name : "Admin",
                role : Role.ADMIN,
                rememberMe : false,
            }
        })

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where : {
                    id : superAdminUser.user.id
                },
                data : {
                    emailVerified : true,
                }
            });

                  
            
        });

    

    } catch (error) {
        console.error("Error seeding super admin: ", error);
        await prisma.user.delete({
            where : {
                email : email,
            }
        })
    }
}