
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('--- START DEBUG ---');
  
  console.log('\n--- USERS ---');
  const users = await db.user.findMany();
  console.log(JSON.stringify(users.map(u => ({ id: u.id, name: u.name, email: u.email })), null, 2));

  console.log('\n--- ORGANIZATIONS ---');
  const orgs = await db.organization.findMany();
  console.log(JSON.stringify(orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug })), null, 2));

  console.log('\n--- ORG MEMBERS ---');
  const members = await db.organizationMember.findMany({
    include: { user: true, organization: true }
  });
  console.log(JSON.stringify(members.map(m => ({ 
    userId: m.userId,
    userEmail: m.user.email, 
    orgId: m.organizationId,
    orgName: m.organization.name, 
    role: m.orgRole 
  })), null, 2));

  console.log('\n--- PROJECTS ---');
  const projects = await db.project.findMany({
    include: { organization: true }
  });
  console.log(JSON.stringify(projects.map(p => ({ 
    id: p.id,
    name: p.name, 
    key: p.key, 
    orgId: p.organizationId,
    orgName: p.organization.name 
  })), null, 2));

  console.log('\n--- INVITATIONS ---');
  const invites = await db.invitation.findMany({
      include: { project: true, organization: true }
  });
  console.log(JSON.stringify(invites.map(i => ({ 
    id: i.id,
    email: i.email, 
    status: i.status, 
    projectId: i.projectId,
    projectName: i.project?.name,
    projectOrgId: i.project?.organizationId,
    orgId: i.organizationId,
    orgName: i.organization?.name
  })), null, 2));
  
  console.log('--- END DEBUG ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await db.$disconnect();
  });
