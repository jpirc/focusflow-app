import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROJECTS = [
    { id: 'work', name: 'Work', color: '#2563eb', bgColor: '#dbeafe', icon: 'briefcase' },
    { id: 'health', name: 'Health & Fitness', color: '#059669', bgColor: '#d1fae5', icon: 'dumbbell' },
    { id: 'learning', name: 'Learning', color: '#7c3aed', bgColor: '#ede9fe', icon: 'book' },
    { id: 'personal', name: 'Personal', color: '#ec4899', bgColor: '#fce7f3', icon: 'heart' },
    { id: 'home', name: 'Home', color: '#f59e0b', bgColor: '#fef3c7', icon: 'home' },
];

async function seedProjects(userId: string) {
    for (let i = 0; i < PROJECTS.length; i++) {
        const project = PROJECTS[i];
        await prisma.project.upsert({
            where: { id: project.id },
            update: {},
            create: {
                id: project.id,
                userId: userId,
                name: project.name,
                color: project.color,
                icon: project.icon,
                sortOrder: i,
            },
        });
    }

    console.log('✅ Default projects created successfully');
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
    console.error('❌ Please provide a user ID as an argument');
    console.log('Usage: npx tsx prisma/seed-projects.ts YOUR_USER_ID');
    process.exit(1);
}

seedProjects(userId)
    .catch((e) => {
        console.error('❌ Error seeding projects:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
