import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PlaceHolderImages } from '../src/lib/placeholder-images';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const hashedPasswordOwner = await bcrypt.hash('password123', 10);
  const hashedPasswordMember = await bcrypt.hash('password123', 10);

  // Create Users
  const owner = await prisma.user.create({
    data: {
      email: 'owner@altitude.com',
      name: 'Demo Owner',
      hashedPassword: hashedPasswordOwner,
      role: 'ADMIN',
      avatarUrl: PlaceHolderImages.find(img => img.id === 'avatar1')?.imageUrl,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@altitude.com',
      name: 'Demo Member',
      hashedPassword: hashedPasswordMember,
      avatarUrl: PlaceHolderImages.find(img => img.id === 'avatar2')?.imageUrl,
    },
  });

  console.log(`Created users: ${owner.name}, ${member.name}`);

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Altitude Demo',
      slug: 'altitude-demo',
      ownerId: owner.id,
      members: {
        create: [
          { userId: owner.id, orgRole: 'OWNER' },
          { userId: member.id, orgRole: 'MEMBER' },
        ],
      },
    },
  });

  console.log(`Created organization: ${organization.name}`);

  // Create Projects
  const scrumProject = await prisma.project.create({
    data: {
      name: 'Scrum Project',
      key: 'SCRUM',
      type: 'SCRUM',
      organizationId: organization.id,
      leadId: owner.id,
    },
  });

  const kanbanProject = await prisma.project.create({
    data: {
      name: 'Kanban Project',
      key: 'KAN',
      type: 'KANBAN',
      organizationId: organization.id,
      leadId: member.id,
    },
  });

  console.log(`Created projects: ${scrumProject.name}, ${kanbanProject.name}`);

  // Create Statuses for both projects
  const statusesData = [
    { name: 'Backlog', category: 'TODO', order: 0 },
    { name: 'To Do', category: 'TODO', order: 1 },
    { name: 'In Progress', category: 'IN_PROGRESS', order: 2 },
    { name: 'In Review', category: 'IN_PROGRESS', order: 3 },
    { name: 'Done', category: 'DONE', order: 4 },
  ];

  const scrumStatuses = await Promise.all(
    statusesData.map(status => prisma.status.create({ data: { ...status, projectId: scrumProject.id } }))
  );
  const kanbanStatuses = await Promise.all(
    statusesData.map(status => prisma.status.create({ data: { ...status, projectId: kanbanProject.id } }))
  );

  console.log('Created statuses for both projects');

  // Create Sprints for Scrum project
  const completedSprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 1',
      projectId: scrumProject.id,
      status: 'COMPLETED',
      startDate: new Date(new Date().setDate(new Date().getDate() - 14)),
      endDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      goal: 'Launch version 1.0 of the feature.',
    },
  });

  const activeSprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 2',
      projectId: scrumProject.id,
      status: 'ACTIVE',
      startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 8)),
      goal: 'Address user feedback and fix critical bugs.',
    },
  });
  
  const futureSprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 3',
      projectId: scrumProject.id,
      status: 'FUTURE',
      startDate: new Date(new Date().setDate(new Date().getDate() + 9)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 23)),
      goal: 'Begin work on the next major feature set.',
    },
  });

  console.log('Created sprints for Scrum project');

  // Create Issues
  const issueTitles = [
    "Implement user authentication", "Design database schema", "Set up CI/CD pipeline",
    "Create landing page", "Develop API for issues", "Fix login button styling",
    "Write documentation for API", "Test user registration flow", "Optimize database queries",
    "Add dark mode support", "Refactor settings page", "Implement password reset",
    "Deploy to staging environment", "Set up analytics", "Research new charting libraries",
    "Improve mobile responsiveness", "Add issue filtering on board", "Create user profile page",
    "Integrate with payment gateway", "Write E2E tests for core features"
  ];
  
  const issuePriorities = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const issueTypes = ['STORY', 'TASK', 'BUG'];

  const issues = [];
  for (let i = 0; i < issueTitles.length; i++) {
    const isScrum = i < 15;
    const project = isScrum ? scrumProject : kanbanProject;
    const statuses = isScrum ? scrumStatuses : kanbanStatuses;

    let status;
    let sprint;

    if (isScrum) {
        if (i < 5) { // Completed sprint
            status = statuses.find(s => s.name === 'Done');
            sprint = completedSprint;
        } else if (i < 12) { // Active sprint
            const statusIndex = i % 4; // To Do, In Progress, In Review, Done
            status = statuses[statusIndex+1];
            sprint = activeSprint;
        } else { // Backlog
            status = statuses.find(s => s.name === 'Backlog');
            sprint = null;
        }
    } else { // Kanban
        const statusIndex = i % 4; // To Do, In Progress, In Review, Done
        status = statuses[statusIndex+1];
        sprint = null;
    }

    const issue = await prisma.issue.create({
      data: {
        title: issueTitles[i],
        key: `${project.key}-${i + 1}`,
        order: i,
        projectId: project.id,
        statusId: status!.id,
        reporterId: owner.id,
        assigneeId: i % 2 === 0 ? owner.id : member.id,
        type: issueTypes[i % 3],
        priority: issuePriorities[i % 5],
        description: `This is a detailed description for the issue: **${issueTitles[i]}**. It requires careful implementation and testing.`,
        estimatePoints: isScrum ? (i % 5) + 1 : null,
        sprints: sprint ? { create: { sprintId: sprint.id } } : undefined,
      },
    });
    issues.push(issue);
  }
  
  console.log(`Created ${issues.length} issues`);

  // Add comments to a few issues
  await prisma.comment.create({
    data: {
        body: "I'll start working on this first thing tomorrow.",
        issueId: issues[5].id,
        authorId: member.id
    }
  });
  await prisma.comment.create({
    data: {
        body: "Good plan! Let me know if you need any help with the API contract.",
        issueId: issues[5].id,
        authorId: owner.id
    }
  });
  await prisma.comment.create({
    data: {
        body: "I've run into a blocker with the third-party library. The documentation is unclear.",
        issueId: issues[6].id,
        authorId: owner.id
    }
  });

  console.log('Added comments to some issues');
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
