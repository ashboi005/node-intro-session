import { prisma } from './lib/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  const sampleFeedbacks = [
    { name: 'Alice Johnson', message: 'Great workshop! Really helped me understand the differences between frontend and backend.', isFlagged: false },
    { name: 'Bob Smith', message: 'The real-time updates are amazing. Love how the data syncs across devices!', isFlagged: false },
    { name: 'Carol Wilson', message: 'Could use more examples, but overall very informative session.', isFlagged: false }
  ];

  for (const feedback of sampleFeedbacks) {
    await prisma.feedback.create({ data: feedback });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 