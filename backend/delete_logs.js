const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usersToMatch = ["nguyễn huy", "Hà Linh Phạm", "Nguyễn Đức Huy", "Huy Nguyễn Đức", "Mạnh Hùng Nguyễn"];
  
  // Find users
  const users = await prisma.user.findMany({
    where: {
      name: { in: usersToMatch }
    },
    select: { id: true, name: true }
  });
  
  const userIds = users.map(u => u.id);
  
  if (userIds.length === 0) {
    console.log("No matching users found.");
    return;
  }
  
  console.log("Found users:", users);

  // Find logs
  const logs = await prisma.adminActionLog.findMany({
    where: {
      actionType: "Cập nhật User",
      targetId: { in: userIds },
      targetType: "USER"
    }
  });
  
  console.log(`Found ${logs.length} logs to delete.`);
  
  // Delete logs
  const result = await prisma.adminActionLog.deleteMany({
    where: {
      id: { in: logs.map(l => l.id) }
    }
  });
  
  console.log(`Deleted ${result.count} logs successfully.`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
